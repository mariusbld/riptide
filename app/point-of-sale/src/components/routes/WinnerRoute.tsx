import confetti from 'canvas-confetti';
import React, { FC } from 'react';
import { useLocation } from 'react-router-dom';
import { usePhoria } from '../../hooks/usePhoria';
import { BackButton } from '../buttons/BackButton';
import { TransactionsLink } from '../buttons/TransactionsLink';
import { PoweredBy } from '../sections/PoweredBy';
import * as css from './WinnerRoute.module.pcss';

interface state {
    amount: number;
}

export const WinnerRoute: FC = () => {
    const location = useLocation();
    const { reset } = usePhoria();
    const { amount } = location.state as state;
    const displayAmount = amount > 1 ? amount.toFixed(0) : amount.toFixed(2);

    const showConfetti = async () => {
        for (let i = 0; i < 5; i++) {
            await confetti({
                startVelocity: 45,
                particleCount: 300,
                spread: 360,
                gravity: 0.5,
                origin: {
                    y: 0.45,
                },
            });
        }
    };

    showConfetti();

    return (
        <div className={css.root}>
            <div className={css.header}>
                <BackButton onClick={reset}>Start Over</BackButton>
                <TransactionsLink />
            </div>
            <div className={css.main}>
                <div>
                    <div className={css.h2}>🎉 Congratulations 🎉</div>
                    <div className={css.h3}>You won ${displayAmount} USDC!</div>
                </div>
            </div>
            <div className={css.footer}>
                <PoweredBy />
            </div>
        </div>
    );
};
