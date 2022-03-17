import React, { FC } from 'react';
import { usePhoria } from '../../hooks/usePhoria';
import { BackButton } from '../buttons/BackButton';
import { TransactionsLink } from '../buttons/TransactionsLink';
import { PoweredBy } from '../sections/PoweredBy';
import * as css from './TryAgainRoute.module.pcss';

export const TryAgainRoute: FC = () => {
    const { reset } = usePhoria();

    return (
        <div className={css.root}>
            <div className={css.header}>
                <BackButton onClick={reset}>Start Over</BackButton>
                <TransactionsLink />
            </div>
            <div className={css.main}>
                <div>
                    <div className={css.h3}>Thanks for shopping with us!</div>
                </div>
            </div>
            <div className={css.footer}>
                <PoweredBy />
            </div>
        </div>
    );
};
