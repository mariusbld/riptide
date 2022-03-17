import { PublicKey } from '@solana/web3.js';
import React, { FC, ReactElement, ReactNode } from 'react';
import { ConfigContext } from '../../hooks/useConfig';
import { Confirmations, Digits } from '../../types';

export interface ConfigProviderProps {
    children: ReactNode;
    recipient: PublicKey;
    label: string;
    reference: PublicKey[];
    splToken?: PublicKey;
    symbol: string;
    icon: ReactElement;
    decimals: Digits;
    minDecimals?: Digits;
    requiredConfirmations?: Confirmations;
    connectWallet?: boolean;
}

export const ConfigProvider: FC<ConfigProviderProps> = ({
    children,
    recipient,
    label,
    reference,
    splToken,
    icon,
    symbol,
    decimals,
    minDecimals = 0,
    requiredConfirmations = 1,
    connectWallet = false,
}) => {
    return (
        <ConfigContext.Provider
            value={{
                recipient,
                label,
                reference,
                splToken,
                symbol,
                icon,
                decimals,
                minDecimals,
                requiredConfirmations,
                connectWallet,
            }}
        >
            {children}
        </ConfigContext.Provider>
    );
};
