import { OrderStatus } from '@0x/types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import styled from 'styled-components';

import { getBaseToken, getQuoteToken, getUserOrders, getWeb3State } from '../../../store/selectors';
import { themeBreakPoints } from '../../../themes/commons';
import { getCurrencyPairFromTokens } from '../../../util/known_currency_pairs';
import { isWeth } from '../../../util/known_tokens';
import { tokenAmountInUnits } from '../../../util/tokens';
import { OrderSide, StoreState, Token, UIOrder, Web3State } from '../../../util/types';
import { Card } from '../../common/card';
import { EmptyContent } from '../../common/empty_content';
import { LoadingWrapper } from '../../common/loading';
import { CustomTD, Table, TH, THead, TR } from '../../common/table';

import { CancelOrderButtonContainer } from './cancel_order_button';

const OrderHistoryCard = styled(Card)`
    height: 100%;
    overflow: auto;
    @media (max-width: ${themeBreakPoints.sm}) {
        margin-top: 10px;
    }
`;

interface StateProps {
    baseToken: Token | null;
    orders: UIOrder[];
    quoteToken: Token | null;
    web3State?: Web3State;
}

type Props = StateProps;

const SideTD = styled(CustomTD)<{ side: OrderSide }>`
    color: ${props =>
        props.side === OrderSide.Buy ? props.theme.componentsTheme.green : props.theme.componentsTheme.red};
`;

const orderToRow = (order: UIOrder, index: number, baseToken: Token, quoteToken: Token) => {
    const sideLabel =
        order.side === OrderSide.Sell ? (
            <FormattedMessage id="order-history.sell" defaultMessage="Sell" description="Sell" />
        ) : (
            <FormattedMessage id="order-history.buy" defaultMessage="Buy" description="Buy" />
        );
    const size = tokenAmountInUnits(order.size, baseToken.decimals, baseToken.displayDecimals);
    let status: any = '--';
    let isOrderFillable = false;

    const filled = order.filled
        ? tokenAmountInUnits(order.filled, baseToken.decimals, baseToken.displayDecimals)
        : null;
    if (order.status) {
        isOrderFillable = order.status === OrderStatus.Fillable;
        status = isOrderFillable ? (
            <FormattedMessage id="order-history.open" defaultMessage="Open" description="Open" />
        ) : (
            <FormattedMessage id="order-history.filled" defaultMessage="Filled" description="Filled" />
        );
    }
    const currencyPair = getCurrencyPairFromTokens(baseToken, quoteToken);
    const price = parseFloat(order.price.toString()).toFixed(currencyPair.config.pricePrecision);

    return (
        <TR key={index}>
            <SideTD side={order.side}>{sideLabel}</SideTD>
            <CustomTD styles={{ textAlign: 'right', tabular: true }}>{size}</CustomTD>
            <CustomTD styles={{ textAlign: 'right', tabular: true }}>{filled}</CustomTD>
            <CustomTD styles={{ textAlign: 'right', tabular: true }}>{price}</CustomTD>
            <CustomTD>{status}</CustomTD>
            <CustomTD styles={{ textAlign: 'center' }}>
                {isOrderFillable ? <CancelOrderButtonContainer order={order} /> : ''}
            </CustomTD>
        </TR>
    );
};

class OrderHistory extends React.Component<Props> {
    public render = () => {
        const { orders, baseToken, quoteToken, web3State } = this.props;
        const ordersToShow = orders.filter(order => order.status === OrderStatus.Fillable);

        let content: React.ReactNode;
        switch (web3State) {
            case Web3State.Locked:
            case Web3State.NotInstalled:
            case Web3State.Connect:
            case Web3State.Connecting: {
                content = (
                    <EmptyContent
                        alignAbsoluteCenter={true}
                        text={
                            <FormattedMessage
                                id="order-history.connect-to-wallet"
                                defaultMessage="Connect Wallet to show your orders"
                                description="Connect to Wallet"
                            />
                        }
                    />
                );
                break;
            }
            case Web3State.Loading: {
                content = <LoadingWrapper minHeight="120px" />;
                break;
            }
            default: {
                if (web3State !== Web3State.Error && (!baseToken || !quoteToken)) {
                    content = <LoadingWrapper minHeight="120px" />;
                } else if (!ordersToShow.length || !baseToken || !quoteToken) {
                    content = (
                        <EmptyContent
                            alignAbsoluteCenter={true}
                            text={
                                <FormattedMessage
                                    id="order-history.no-orders"
                                    defaultMessage="There are no orders to show"
                                    description="No Orders"
                                />
                            }
                        />
                    );
                } else {
                    const tokenQuoteSymbol = isWeth(quoteToken.symbol) ? 'ETH' : quoteToken.symbol.toUpperCase();
                    const tokenBaseSymbol = isWeth(baseToken.symbol) ? 'ETH' : baseToken.symbol.toUpperCase();
                    content = (
                        <Table isResponsive={true}>
                            <THead>
                                <TR>
                                    <TH>Side</TH>
                                    <TH styles={{ textAlign: 'right' }}>
                                        <FormattedMessage
                                            id="order-history.size"
                                            defaultMessage="Size"
                                            description="Size"
                                        />{' '}
                                        ({tokenBaseSymbol})
                                    </TH>
                                    <TH styles={{ textAlign: 'right' }}>
                                        <FormattedMessage
                                            id="order-history.filled"
                                            defaultMessage="Filled"
                                            description="Filled"
                                        />{' '}
                                        ({tokenBaseSymbol})
                                    </TH>
                                    <TH styles={{ textAlign: 'right' }}>
                                        <FormattedMessage
                                            id="order-history.price"
                                            defaultMessage="Price"
                                            description="Price"
                                        />{' '}
                                        ({tokenQuoteSymbol})
                                    </TH>
                                    <TH>Status</TH>
                                    <TH>&nbsp;</TH>
                                </TR>
                            </THead>
                            <tbody>
                                {ordersToShow.map((order, index) => orderToRow(order, index, baseToken, quoteToken))}
                            </tbody>
                        </Table>
                    );
                }
                break;
            }
        }

        return (
            <OrderHistoryCard
                title={
                    <FormattedMessage
                        id="order-history.current-orders"
                        defaultMessage="My Current Orders"
                        description="My Current Orders"
                    />
                }
            >
                {content}
            </OrderHistoryCard>
        );
    };
}

const mapStateToProps = (state: StoreState): StateProps => {
    return {
        baseToken: getBaseToken(state),
        orders: getUserOrders(state),
        quoteToken: getQuoteToken(state),
        web3State: getWeb3State(state),
    };
};

const OrderHistoryContainer = connect(mapStateToProps)(OrderHistory);

export { OrderHistory, OrderHistoryContainer };
