import { getAssociatedTokenAddress } from '@solana/spl-token';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import React, { FC, ReactNode, useCallback, useEffect, useState } from 'react';
import { useConfig } from '../../hooks/useConfig';
import { useNavigateWithQuery } from '../../hooks/useNavigateWithQuery';
import { PaymentStatus, usePayment } from '../../hooks/usePayment';
import { PhoriaContext, PhoriaStatus } from '../../hooks/usePhoria';

const CAMPAIGN_PDA_SEED = 'campaign';
const PROGRAM_ID = process.env.REACT_APP_PROGRAM_ID;

export interface PhoriaProviderProps {
    children: ReactNode;
}

export const PhoriaProvider: FC<PhoriaProviderProps> = ({ children }) => {
    const { connection } = useConnection();
    const { splToken } = useConfig();
    const { status: paymentStatus, signature, reset: paymentReset } = usePayment();
    const navigate = useNavigateWithQuery();

    const [status, setStatus] = useState(PhoriaStatus.New);
    const [pda, setPda] = useState<PublicKey>();
    const [paymentSlot, setPaymentSlot] = useState<number>();
    const [buyerToken, setBuyerToken] = useState<PublicKey>();
    const [buyerWallet, setBuyerWallet] = useState<PublicKey>();

    const reset = useCallback(() => {
        setStatus(PhoriaStatus.New);
        setPaymentSlot(undefined);
        setBuyerToken(undefined);
        setBuyerWallet(undefined);
        paymentReset();
    }, [paymentReset]);

    useEffect(() => {
        if (!PROGRAM_ID) return;
        (async () => {
            try {
                const programId = new PublicKey(PROGRAM_ID);
                const [localPda, _bump] = await PublicKey.findProgramAddress(
                    [Buffer.from(CAMPAIGN_PDA_SEED)],
                    programId
                );
                setPda(localPda);
            } catch (err) {
                console.error(err);
            }
        })();
    }, []);

    useEffect(() => {
        if (
            !(
                paymentStatus === PaymentStatus.Finalized &&
                status === PhoriaStatus.New &&
                splToken &&
                connection &&
                signature
            )
        )
            return;
        (async () => {
            try {
                const [tx] = await connection.getParsedTransactions([signature]);
                if (!tx) {
                    throw new Error(`Cannot find transaction for signature ${signature}`);
                }
                setPaymentSlot(tx.slot);
                const buyer = tx.transaction.message.accountKeys.find((k) => k.signer)?.pubkey;
                setBuyerWallet(buyer);
                if (!buyer) {
                    throw new Error(`Cannot find buyer for transaction signature ${signature}`);
                }
                const token = await getAssociatedTokenAddress(splToken, buyer);
                setBuyerToken(token);
                setStatus(PhoriaStatus.Pending);
                navigate('/raffle-pending', { replace: true });
            } catch (err) {
                console.error(err);
            }
        })();
    }, [navigate, status, paymentStatus, connection, signature, splToken]);

    // When status is pending, poll for crank results and display raffle result.
    useEffect(() => {
        if (!(status === PhoriaStatus.Pending && pda && buyerWallet && buyerToken && paymentSlot)) return;
        let changed = false;
        let lastSignature: string;

        const interval = setInterval(async () => {
            try {
                const sigInfos = await connection.getSignaturesForAddress(pda, { until: lastSignature }, 'confirmed');
                if (!sigInfos.length) {
                    return;
                }
                // getSignaturesForAddress retrieves in reverse order by time.
                lastSignature = sigInfos[0].signature;
                // TODO: find a 1-to-1 match based on the payment signature.
                // This is a heuristic looking for txs involving Phoria PDA and Buyer Token.
                const postPaymentSigInfos = sigInfos.filter((info) => info.slot > paymentSlot);
                const signatures = postPaymentSigInfos.map((e) => e.signature);
                const txs = await connection.getParsedTransactions(signatures);
                const tx = txs.find((tx) => {
                    if (!tx) return false;
                    const accountKeys = tx.transaction.message.accountKeys.map((e) => e.pubkey);
                    const foundKey = accountKeys.find((k) => k.toString() === buyerToken.toString());
                    return !!foundKey;
                });
                if (!tx) return; // Transaction not yet present, still waiting.
                const preTokenAccount = tx.meta?.preTokenBalances?.find(
                    (e) => e.owner?.toString() === buyerWallet?.toString()
                );
                const postTokenAccount = tx.meta?.postTokenBalances?.find(
                    (e) => e.owner?.toString() === buyerWallet?.toString()
                );
                if (!(preTokenAccount && postTokenAccount)) {
                    throw new Error('Token balances not found in crank transaction!');
                }
                const preBalance = preTokenAccount.uiTokenAmount.uiAmount;
                const postBalance = postTokenAccount.uiTokenAmount.uiAmount;
                if (preBalance === null || postBalance === null) {
                    throw new Error(
                        `Token balance is null: pre=${JSON.stringify(preTokenAccount)}, post=${JSON.stringify(
                            postTokenAccount
                        )}`
                    );
                }
                const deltaBalance = postBalance - preBalance;
                if (deltaBalance < 0) {
                    throw new Error(
                        `Negative delta balance: pre=${JSON.stringify(preTokenAccount)}, post=${JSON.stringify(
                            postTokenAccount
                        )}`
                    );
                }
                if (!changed) {
                    clearInterval(interval);
                    if (deltaBalance === 0) {
                        setStatus(PhoriaStatus.TryAgain);
                        navigate('/tryagain', { replace: true });
                    } else {
                        setStatus(PhoriaStatus.Winner);
                        navigate('/winner', { replace: true, state: { amount: deltaBalance } });
                    }
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                console.log(error);
            }
        }, 500);

        return () => {
            changed = true;
            clearInterval(interval);
        };
    }, [status, connection, navigate, pda, buyerWallet, buyerToken, paymentSlot]);

    return <PhoriaContext.Provider value={{ status, reset }}>{children}</PhoriaContext.Provider>;
};
