import { createContext, useContext } from 'react';

export enum PhoriaStatus {
    New = 'New',
    Pending = 'Pending',
    Winner = 'Winner',
    TryAgain = 'TryAgain',
}

export interface PhoriaContextState {
    status: PhoriaStatus;
    reset(): void;
}

export const PhoriaContext = createContext<PhoriaContextState>({} as PhoriaContextState);

export function usePhoria(): PhoriaContextState {
    return useContext(PhoriaContext);
}
