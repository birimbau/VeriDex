import { getType } from 'typesafe-actions';

import { FEE_PERCENTAGE, FEE_RECIPIENT } from '../../common/constants';
import { RelayerState } from '../../util/types';
import * as actions from '../actions';
import { RootAction } from '../reducers';

const initialRelayerState: RelayerState = {
    orders: [],
    userOrders: [],
    accountMarketStats: [],
    ieoOrders: [],
    userIEOOrders: [],
    feePercentage: FEE_PERCENTAGE,
    feeRecipient: FEE_RECIPIENT,
};

export function relayer(state: RelayerState = initialRelayerState, action: RootAction): RelayerState {
    switch (action.type) {
        case getType(actions.setOrders):
            return { ...state, orders: action.payload };
        case getType(actions.setTokenIEOOrders):
            return { ...state, ieoOrders: action.payload };
        case getType(actions.setAccountMarketStats):
            return { ...state, accountMarketStats: action.payload };
        case getType(actions.setUserOrders):
            return { ...state, userOrders: action.payload };
        case getType(actions.setUserIEOOrders):
            return { ...state, userIEOOrders: action.payload };
        case getType(actions.initializeRelayerData):
            return { ...state, ...action.payload };
        case getType(actions.setFeePercentage):
            return { ...state, feePercentage: action.payload };
        case getType(actions.setFeeRecipient):
            return { ...state, feeRecipient: action.payload };
        default:
            return state;
    }
}
