import { BigNumber } from '@0x/utils';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import styled, { withTheme } from 'styled-components';

import { NETWORK_ID, RELAYER_URL } from '../../common/constants';
import { openFiatOnRampChooseModal, startToggleTokenLockSteps, startTranferTokenSteps } from '../../store/actions';
import {
    getEthAccount,
    getEthBalance,
    getEthInUsd,
    getTokenBalances,
    getTokensPrice,
    getWallet,
    getWeb3State,
    getWethTokenBalance,
} from '../../store/selectors';
import { Theme, themeBreakPoints } from '../../themes/commons';
import { getEtherscanLinkForToken, getEtherscanLinkForTokenAndAddress, tokenAmountInUnits } from '../../util/tokens';
import { ButtonVariant, StoreState, Token, TokenBalance, TokenPrice, Wallet, Web3State } from '../../util/types';
import { Button } from '../common/button';
import { Card } from '../common/card';
import { TokenIcon } from '../common/icons/token_icon';
import { LoadingWrapper } from '../common/loading';
import { CustomTD, Table, TH, THead, THLast, TR } from '../common/table';
import { ZeroXInstantWidget } from '../erc20/common/0xinstant_widget';

import { TransferTokenModal } from './wallet_transfer_token_modal';

interface StateProps {
    ethBalance: BigNumber;
    tokenBalances: TokenBalance[];
    web3State: Web3State;
    wethTokenBalance: TokenBalance | null;
    ethAccount: string;
    ethUsd: BigNumber | null;
    tokensPrice: TokenPrice[] | null;
    wallet: Wallet | null;
}
interface OwnProps {
    theme: Theme;
}

interface DispatchProps {
    onStartToggleTokenLockSteps: (token: Token, isUnlocked: boolean) => void;
    onSubmitTransferToken: (amount: BigNumber, token: Token, address: string, isEth: boolean) => Promise<any>;
    onClickOpenFiatOnRampModal: (isOpen: boolean) => void;
}

type Props = StateProps & DispatchProps & OwnProps;

interface State {
    modalIsOpen: boolean;
    isSubmitting: boolean;
    tokenBalanceSelected: TokenBalance | null;
    isEth: boolean;
}

const THStyled = styled(TH)`
    &:first-child {
        padding-right: 0;
    }
`;

const TokenTD = styled(CustomTD)`
    padding-bottom: 10px;
    padding-right: 0;
    padding-top: 10px;
    width: 40px;
`;

const BuyETHButton = styled(Button)`
    margin-left: 5px;
`;

const TokenIconStyled = styled(TokenIcon)`
    margin: 0 auto 0 0;
`;

const CustomTDTokenName = styled(CustomTD)`
    white-space: nowrap;
`;

const TokenEtherscanLink = styled.a`
    align-items: center;
    color: ${props => props.theme.componentsTheme.myWalletLinkColor};
    display: flex;
    font-size: 16px;
    font-weight: 500;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
    @media (max-width: ${themeBreakPoints.sm}) {
        display: inline;
    }
`;

const QuantityEtherscanLink = styled.a`
    align-items: center;
    color: ${props => props.theme.componentsTheme.myWalletLinkColor};
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
`;

const CustomTDLockIcon = styled(CustomTD)`
    .lockedIcon {
        path {
            fill: ${props => props.theme.componentsTheme.iconLockedColor};
        }
    }

    .unlockedIcon {
        path {
            fill: ${props => props.theme.componentsTheme.iconUnlockedColor};
        }
    }
`;

const CustomTDPriceChange = styled(CustomTD)`
    .lockedIcon {
        path {
            fill: ${props => props.theme.componentsTheme.iconLockedColor};
        }
    }

    .unlockedIcon {
        path {
            fill: ${props => props.theme.componentsTheme.iconUnlockedColor};
        }
    }
`;

const TokenName = styled.span`
    font-weight: 700;
    @media (max-width: ${themeBreakPoints.sm}) {
        display: block;
    }
`;
const TokenNameSeparator = styled.span`
    @media (max-width: ${themeBreakPoints.sm}) {
        display: none;
    }
`;

const TBody = styled.tbody`
    > tr:last-child > td {
        border-bottom: none;
    }
`;

const ButtonsContainer = styled.span`
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    @media (min-width: ${themeBreakPoints.xs}) {
        flex-wrap: wrap;
        display: -webkit-inline-box;
    }
`;

const LockIcon = styled.span`
    cursor: pointer;
`;

const lockedIcon = () => {
    return (
        <svg
            data-icon="lock"
            className="lockedIcon"
            fill="none"
            height="16"
            viewBox="0 0 13 16"
            width="13"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M6.24949 0C3.66224 0 1.54871 2.21216 1.54871 4.92014V6.33135C0.692363 6.33135 0 7.05602 0 7.95232V14.379C0 15.2753 0.692363 16 1.54871 16H10.9503C11.8066 16 12.499 15.2753 12.499 14.379V7.95232C12.499 7.05602 11.8066 6.33135 10.9503 6.33135V4.92014C10.9503 2.21216 8.83674 0 6.24949 0ZM9.31046 6.33135H3.18851V4.92014C3.18851 3.16567 4.55502 1.71633 6.24949 1.71633C7.94395 1.71633 9.31046 3.16567 9.31046 4.92014V6.33135Z" />
        </svg>
    );
};

const unlockedIcon = () => {
    return (
        <svg
            data-icon="lock-open"
            className="unlockedIcon"
            fill="none"
            height="17"
            viewBox="0 0 13 17"
            width="13"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M1.54871 4.92014C1.54871 2.21216 3.66224 0 6.24949 0C8.83674 0 10.9503 2.21216 10.9503 4.92014H9.31046C9.31046 3.16567 7.94395 1.71633 6.24949 1.71633C4.55502 1.71633 3.18851 3.16567 3.18851 4.92014V7.33135H9.31046H10.9503C11.8066 7.33135 12.499 8.05602 12.499 8.95232V15.379C12.499 16.2753 11.8066 17 10.9503 17H1.54871C0.692363 17 0 16.2753 0 15.379V8.95232C0 8.05602 0.692363 7.33135 1.54871 7.33135V4.92014Z" />
        </svg>
    );
};

interface LockCellProps {
    isUnlocked: boolean;
    onClick: any;
    styles?: any;
}

const LockCell = ({ isUnlocked, onClick }: LockCellProps) => {
    return (
        <CustomTDLockIcon styles={{ borderBottom: true, textAlign: 'center' }}>
            <LockIcon onClick={onClick}>{isUnlocked ? unlockedIcon() : lockedIcon()}</LockIcon>
        </CustomTDLockIcon>
    );
};

interface PriceChangeProps {
    price_usd_24h_change: BigNumber;
}
const PriceChangeCell = ({ price_usd_24h_change }: PriceChangeProps) => {
    return (
        <CustomTDPriceChange
            styles={{ borderBottom: true, textAlign: 'right', color: price_usd_24h_change.gte(0) ? 'green' : 'red' }}
        >
            {price_usd_24h_change.toFormat(2)} %
        </CustomTDPriceChange>
    );
};

class WalletTokenBalances extends React.PureComponent<Props, State> {
    public readonly state: State = {
        modalIsOpen: false,
        isSubmitting: false,
        tokenBalanceSelected: null,
        isEth: false,
    };

    public render = () => {
        const {
            ethBalance,
            tokenBalances,
            onStartToggleTokenLockSteps,
            web3State,
            wethTokenBalance,
            ethAccount,
            theme,
            tokensPrice,
            ethUsd,
            wallet,
            onClickOpenFiatOnRampModal,
        } = this.props;

        if (!wethTokenBalance) {
            return null;
        }

        const wethToken = wethTokenBalance.token;
        const totalEth = wethTokenBalance.balance.plus(ethBalance);
        const formattedTotalEthBalance = tokenAmountInUnits(totalEth, wethToken.decimals, wethToken.displayDecimals);
        const onTotalEthClick = () => onStartToggleTokenLockSteps(wethTokenBalance.token, wethTokenBalance.isUnlocked);
        const ethPrice = tokensPrice && tokensPrice.find(t => t.c_id === 'ethereum');
        const openTransferEthModal = () => {
            this.setState({
                modalIsOpen: true,
                isEth: true,
            });
        };

        const openFiatOnRamp = () => {
            onClickOpenFiatOnRampModal(true);
        };

        const totalEthRow = (
            <TR>
                <TokenTD>
                    <TokenIconStyled
                        symbol={wethToken.symbol}
                        primaryColor={wethToken.primaryColor}
                        icon={wethToken.icon}
                    />
                </TokenTD>
                <CustomTDTokenName styles={{ borderBottom: true }}>
                    <TokenName>
                        <FormattedMessage
                            id="wallet-token-balances.eth-total"
                            defaultMessage="ETH Total"
                            description="ETH Total"
                        />
                    </TokenName>{' '}
                    {` (ETH + wETH)`}
                </CustomTDTokenName>
                <CustomTD styles={{ borderBottom: true, textAlign: 'right', tabular: true }}>
                    {formattedTotalEthBalance}
                </CustomTD>
                <CustomTD styles={{ borderBottom: true, textAlign: 'right', tabular: true }}>
                    {ethUsd ? `${ethUsd.toString()}$` : '-'}
                </CustomTD>
                <CustomTD styles={{ borderBottom: true, textAlign: 'right', tabular: true }}>
                    {ethUsd ? `${ethUsd.multipliedBy(new BigNumber(formattedTotalEthBalance)).toFixed(3)}$` : '-'}
                </CustomTD>
                {ethPrice ? (
                    <PriceChangeCell price_usd_24h_change={ethPrice.price_usd_24h_change} />
                ) : (
                    <CustomTD styles={{ borderBottom: true, textAlign: 'right' }}>-</CustomTD>
                )}
                <LockCell
                    isUnlocked={wethTokenBalance.isUnlocked}
                    onClick={onTotalEthClick}
                    styles={{ borderBottom: true, textAlign: 'center' }}
                />
                <CustomTD styles={{ borderBottom: true, textAlign: 'left' }}>
                    <ButtonsContainer>
                        <Button onClick={openTransferEthModal} variant={ButtonVariant.Primary}>
                            <FormattedMessage
                                id="wallet-token-balances.send"
                                defaultMessage="Send"
                                description="Send"
                            />
                        </Button>
                        <BuyETHButton onClick={openFiatOnRamp} variant={ButtonVariant.Buy}>
                            <FormattedMessage id="wallet-token-balances.buy" defaultMessage="Buy" description="Buy" />
                        </BuyETHButton>
                    </ButtonsContainer>
                </CustomTD>
            </TR>
        );

        const tokensRows = tokenBalances.map((tokenBalance, index) => {
            const { token, balance, isUnlocked } = tokenBalance;
            const { symbol } = token;
            const formattedBalance = tokenAmountInUnits(balance, token.decimals, token.displayDecimals);
            const onClick = () => onStartToggleTokenLockSteps(token, isUnlocked);
            const openTransferModal = () => {
                this.setState({
                    modalIsOpen: true,
                    tokenBalanceSelected: tokenBalance,
                    isEth: false,
                });
            };
            const tokenPrice = tokensPrice && tokensPrice.find(t => t.c_id === token.c_id);

            return (
                <TR key={symbol}>
                    <TokenTD>
                        <TokenIconStyled symbol={token.symbol} primaryColor={token.primaryColor} icon={token.icon} />
                    </TokenTD>
                    <CustomTDTokenName styles={{ borderBottom: true }}>
                        <TokenEtherscanLink href={getEtherscanLinkForToken(token)} target={'_blank'}>
                            <TokenName>{token.symbol.toUpperCase()}</TokenName>{' '}
                            <TokenNameSeparator>{` - `}</TokenNameSeparator>
                            {`${token.name}`}
                        </TokenEtherscanLink>
                    </CustomTDTokenName>
                    <CustomTD styles={{ borderBottom: true, textAlign: 'right' }}>
                        <QuantityEtherscanLink
                            href={getEtherscanLinkForTokenAndAddress(token, ethAccount)}
                            target={'_blank'}
                        >
                            {formattedBalance}
                        </QuantityEtherscanLink>
                    </CustomTD>
                    <CustomTD styles={{ borderBottom: true, textAlign: 'right' }}>
                        {tokenPrice ? `${tokenPrice.price_usd.toString()}$` : '-'}
                    </CustomTD>
                    <CustomTD styles={{ borderBottom: true, textAlign: 'right' }}>
                        {tokenPrice
                            ? `${tokenPrice.price_usd.multipliedBy(new BigNumber(formattedBalance)).toFixed(3)}$`
                            : '-'}
                    </CustomTD>
                    {tokenPrice ? (
                        <PriceChangeCell price_usd_24h_change={tokenPrice.price_usd_24h_change} />
                    ) : (
                        <CustomTD styles={{ borderBottom: true, textAlign: 'right' }}>-</CustomTD>
                    )}
                    <LockCell
                        isUnlocked={isUnlocked}
                        onClick={onClick}
                        styles={{ borderBottom: true, textAlign: 'center' }}
                    />
                    <CustomTD styles={{ borderBottom: true, textAlign: 'left' }}>
                        <ButtonsContainer>
                            <Button onClick={openTransferModal} variant={ButtonVariant.Primary}>
                                <FormattedMessage
                                    id="wallet-token-balances.sell"
                                    defaultMessage="Sell"
                                    description="Sell"
                                />
                            </Button>
                            <ZeroXInstantWidget
                                orderSource={RELAYER_URL}
                                tokenAddress={token.address}
                                networkId={NETWORK_ID}
                                walletDisplayName={wallet}
                            />
                        </ButtonsContainer>
                    </CustomTD>
                </TR>
            );
        });
        const totalHoldingsRow = () => {
            const totalHoldingsValue: BigNumber =
                (tokenBalances.length &&
                    tokenBalances
                        .filter(tb => tb.token.c_id !== null)
                        .map(tb => {
                            const tokenPrice = tokensPrice && tokensPrice.find(tp => tp.c_id === tb.token.c_id);
                            if (tokenPrice) {
                                const { token, balance } = tb;
                                const formattedBalance = new BigNumber(
                                    tokenAmountInUnits(balance, token.decimals, token.displayDecimals),
                                );
                                return formattedBalance.multipliedBy(tokenPrice.price_usd);
                            } else {
                                return new BigNumber(0);
                            }
                        })
                        .reduce((p, c) => {
                            return p.plus(c);
                        })) ||
                new BigNumber(0);

            return (
                <TR>
                    <CustomTD styles={{ borderBottom: true, textAlign: 'right', tabular: true }} />
                    <CustomTDTokenName styles={{ borderBottom: true }}>
                        <FormattedMessage
                            id="wallet-token-balances.total-holdings"
                            defaultMessage="TOTAL HOLDINGS"
                            description="TOTAL HOLDINGS"
                        />
                    </CustomTDTokenName>
                    <CustomTD styles={{ borderBottom: true, textAlign: 'right', tabular: true }} />
                    <CustomTD styles={{ borderBottom: true, textAlign: 'right', tabular: true }} />
                    <CustomTD styles={{ borderBottom: true, textAlign: 'right', tabular: true }}>
                        {`${totalHoldingsValue.toFixed(3)}$`}
                    </CustomTD>
                    <CustomTD styles={{ borderBottom: true, textAlign: 'right', tabular: true }} />
                    <CustomTD styles={{ borderBottom: true, textAlign: 'right', tabular: true }} />
                    <CustomTD styles={{ borderBottom: true, textAlign: 'left' }}>Prices by Coingecko</CustomTD>
                </TR>
            );
        };

        let content: React.ReactNode;
        if (web3State === Web3State.Loading) {
            content = <LoadingWrapper />;
        } else {
            content = (
                <>
                    <Table isResponsive={true}>
                        <THead>
                            <TR>
                                <THStyled>Token</THStyled>
                                <THStyled>{}</THStyled>
                                <THStyled styles={{ textAlign: 'right' }}>
                                    <FormattedMessage
                                        id="wallet-token-balances.availabe-qtt"
                                        defaultMessage="Available Qty."
                                        description="Available Qty."
                                    />
                                </THStyled>
                                <THStyled styles={{ textAlign: 'right' }}>
                                    <FormattedMessage
                                        id="wallet-token-balances.price"
                                        defaultMessage="Price (USD)"
                                        description="Price (USD)"
                                    />
                                </THStyled>
                                <THStyled styles={{ textAlign: 'right' }}>
                                    <FormattedMessage
                                        id="wallet-token-balances.value"
                                        defaultMessage="Value (USD)"
                                        description="Value (USD)"
                                    />
                                </THStyled>
                                <THStyled styles={{ textAlign: 'right' }}>
                                    <FormattedMessage
                                        id="wallet-token-balances.change"
                                        defaultMessage="% Change"
                                        description="% Change"
                                    />
                                </THStyled>
                                <THLast styles={{ textAlign: 'center' }}>
                                    <FormattedMessage
                                        id="wallet-token-balances.locked"
                                        defaultMessage="Locked?"
                                        description="Locked?"
                                    />
                                </THLast>
                                <THLast styles={{ textAlign: 'center' }}>
                                    <FormattedMessage
                                        id="wallet-token-balances.actions"
                                        defaultMessage="Actions"
                                        description="Actions"
                                    />
                                </THLast>
                            </TR>
                        </THead>
                        <TBody>
                            {totalEthRow}
                            {tokensRows}
                            {totalHoldingsRow()}
                        </TBody>
                    </Table>
                    <TransferTokenModal
                        isOpen={this.state.modalIsOpen}
                        tokenBalance={this.state.tokenBalanceSelected as TokenBalance}
                        isSubmitting={this.state.isSubmitting}
                        onSubmit={this.handleSubmit}
                        style={theme.modalTheme}
                        closeModal={this.closeModal}
                        ethBalance={ethBalance}
                        isEth={this.state.isEth}
                        wethToken={wethToken}
                    />
                </>
            );
        }

        return (
            <Card
                title={
                    <FormattedMessage
                        id="wallet-token-balances.token-balances"
                        defaultMessage="Token Balances"
                        description="Token Balances"
                    />
                }
            >
                {content}
            </Card>
        );
    };
    public closeModal = () => {
        this.setState({
            modalIsOpen: false,
        });
    };

    public openModal = () => {
        this.setState({
            modalIsOpen: true,
        });
    };

    public handleSubmit = async (amount: BigNumber, token: Token, address: string, isEth: boolean) => {
        this.setState({
            isSubmitting: true,
        });
        try {
            await this.props.onSubmitTransferToken(amount, token, address, isEth);
        } finally {
            this.setState({
                isSubmitting: false,
            });
            this.closeModal();
        }
    };
}

const mapStateToProps = (state: StoreState): StateProps => {
    return {
        ethBalance: getEthBalance(state),
        tokenBalances: getTokenBalances(state),
        web3State: getWeb3State(state),
        wethTokenBalance: getWethTokenBalance(state),
        ethAccount: getEthAccount(state),
        ethUsd: getEthInUsd(state),
        tokensPrice: getTokensPrice(state),
        wallet: getWallet(state),
    };
};
const mapDispatchToProps = {
    onStartToggleTokenLockSteps: startToggleTokenLockSteps,
    onSubmitTransferToken: startTranferTokenSteps,
    onClickOpenFiatOnRampModal: openFiatOnRampChooseModal,
};

const WalletTokenBalancesContainer = withTheme(connect(mapStateToProps, mapDispatchToProps)(WalletTokenBalances));

// tslint:disable-next-line: max-file-line-count
export { WalletTokenBalances, WalletTokenBalancesContainer };
