import React, { FC } from 'react';
import { usePhoria } from '../../hooks/usePhoria';
import { BackButton } from '../buttons/BackButton';
import { TransactionsLink } from '../buttons/TransactionsLink';
import { PoweredBy } from '../sections/PoweredBy';
import * as css from './RafflePendingRoute.module.pcss';

export const RafflePendingRoute: FC = () => {
    const { reset } = usePhoria();

    return (
        <div className={css.root}>
            <div className={css.header}>
                <BackButton onClick={reset}>Start Over</BackButton>
                <TransactionsLink />
            </div>
            <div className={css.main}>
                <div className={css.rewards}>
                    <div className={css.h3}>Phoria Rewards&#8203;</div>
                </div>
            </div>
            <div className={css.footer}>
                <PoweredBy />
            </div>
        </div>
    );
};
