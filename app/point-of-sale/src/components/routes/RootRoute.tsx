import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { TorusWalletAdapter } from '@solana/wallet-adapter-torus';
import { PublicKey } from '@solana/web3.js';
import React, { FC, useMemo } from 'react';
import { Outlet, useSearchParams } from 'react-router-dom';
import { DEVNET_ENDPOINT } from '../../utils/constants';
import { ConfigProvider } from '../contexts/ConfigProvider';
import { FullscreenProvider } from '../contexts/FullscreenProvider';
import { PaymentProvider } from '../contexts/PaymentProvider';
import { PhoriaProvider } from '../contexts/PhoriaProvider';
import { ThemeProvider } from '../contexts/ThemeProvider';
import { TransactionsProvider } from '../contexts/TransactionsProvider';
import { SolanaPayLogo } from '../images/SolanaPayLogo';
import { USDCIcon } from '../images/USDCIcon';
import * as css from './RootRoute.module.pcss';

const USDC_MINT_DEVNET = new PublicKey('8gXpsEei2wxT2JNo3tsGMC8oa6Ae5S6VEX686v4DMdKr');
const USDC_MINT_MAINNET = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

const MAINNET_ENDPOINT = 'https://ssc-dao.genesysgo.net/';

type endpointType = 'mainnet' | 'devnet';
const ENDPOINTS = new Map<endpointType, string>([
    ['devnet', DEVNET_ENDPOINT],
    ['mainnet', MAINNET_ENDPOINT],
]);

const USDC_MINT = new Map<endpointType, PublicKey>([
    ['devnet', USDC_MINT_DEVNET],
    ['mainnet', USDC_MINT_MAINNET],
]);

export const ConfigRoute: FC = () => {
    return (
        <div className={css.logo}>
            <SolanaPayLogo width={240} height={88} />
            <form>
                <input type="text" name="recipient" placeholder="Enter Wallet Address" required />
                <br />
                <input type="text" name="label" placeholder="Enter Label" required />
                <br />
                <textarea name="reference" placeholder="Enter Reference Keys (optional)" />
                <br />
                <input type="submit" name="submit" value="Start" />
            </form>
        </div>
    );
};

export const RootRoute: FC = () => {
    // If you're testing without a phone, set this to true to allow a browser-based wallet connection to be used
    const connectWallet = false;
    const wallets = useMemo(
        () => (connectWallet ? [new PhantomWalletAdapter(), new TorusWalletAdapter()] : []),
        [connectWallet]
    );

    const [params] = useSearchParams();

    const { recipient, label, reference, endpoint, usdcMint } = useMemo(() => {
        let recipient: PublicKey | undefined, label: string | undefined;
        let reference: PublicKey[] = [];

        const recipientParam = params.get('recipient');
        const labelParam = params.get('label');
        const endpointParam: endpointType = params.get('endpoint') as endpointType;
        const endpoint = ENDPOINTS.get(endpointParam) ?? DEVNET_ENDPOINT;
        const usdcMint = USDC_MINT.get(endpointParam) ?? USDC_MINT_DEVNET;

        const referenceParams = params
            .getAll('reference')
            .map((p) => p.trim().split(/[ ,]+/))
            .flatMap((e) => e)
            .filter((e) => e);

        const uniqueReferenceParams = [...new Set(referenceParams)];
        if (recipientParam && labelParam) {
            try {
                recipient = new PublicKey(recipientParam);
                label = labelParam;
            } catch (error) {
                console.error(error);
            }
        }
        if (uniqueReferenceParams.length) {
            try {
                reference = uniqueReferenceParams.map((r) => new PublicKey(r));
            } catch (error) {
                console.error(error);
            }
        }

        return { recipient, label, reference, endpoint, usdcMint };
    }, [params]);
    return (
        <ThemeProvider>
            <FullscreenProvider>
                {recipient && label ? (
                    <ConnectionProvider endpoint={endpoint}>
                        <WalletProvider wallets={wallets} autoConnect={connectWallet}>
                            <WalletModalProvider>
                                <ConfigProvider
                                    recipient={recipient}
                                    label={label}
                                    reference={reference}
                                    splToken={usdcMint}
                                    symbol="USDC"
                                    icon={<USDCIcon />}
                                    decimals={6}
                                    minDecimals={2}
                                    connectWallet={connectWallet}
                                >
                                    <TransactionsProvider>
                                        <PaymentProvider>
                                            <PhoriaProvider>
                                                <Outlet />
                                            </PhoriaProvider>
                                        </PaymentProvider>
                                    </TransactionsProvider>
                                </ConfigProvider>
                            </WalletModalProvider>
                        </WalletProvider>
                    </ConnectionProvider>
                ) : (
                    <ConfigRoute />
                )}
            </FullscreenProvider>
        </ThemeProvider>
    );
};
