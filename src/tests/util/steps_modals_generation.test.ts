import { assetDataUtils } from '@0x/order-utils';
import { BigNumber, NULL_BYTES } from '@0x/utils';

import { ZERO } from '../../common/constants';
import {
    createBuySellLimitMatchingSteps,
    createBuySellLimitSteps,
    createBuySellMarketSteps,
    getUnlockTokenStepIfNeeded,
    getUnlockZrxStepIfNeeded,
    getWrapEthStepIfNeeded,
} from '../../util/steps_modals_generation';
import { tokenFactory } from '../../util/test-utils';
import { unitsInTokenAmount } from '../../util/tokens';
import {
    OrderFeeData,
    OrderSide,
    Step,
    StepKind,
    StepToggleTokenLock,
    StepWrapEth,
    TokenBalance,
} from '../../util/types';

const DEFAULT_FEE_DATA = {
    makerFeeAssetData: NULL_BYTES,
    takerFeeAssetData: NULL_BYTES,
    makerFee: ZERO,
    takerFee: ZERO,
};

const tokenDefaults = {
    primaryColor: 'white',
    decimals: 18,
    displayDecimals: 2,
};
const wethToken = {
    ...tokenDefaults,
    address: '0x100',
    symbol: 'weth',
    name: 'wETH',
};

const TOKENS = {
    ZRX: tokenFactory.build({ decimals: 18, symbol: 'zrx' }),
    MKR: tokenFactory.build({ decimals: 18, symbol: 'mkr' }),
    REP: tokenFactory.build({ decimals: 18, symbol: 'rep' }),
    DGD: tokenFactory.build({ decimals: 18, symbol: 'dgd' }),
    MLN: tokenFactory.build({ decimals: 18, symbol: 'mln' }),
    WETH: tokenFactory.build({ decimals: 18, symbol: 'weth' }),
};

const tokenBalances: TokenBalance[] = [
    {
        balance: new BigNumber(1),
        token: {
            ...tokenDefaults,
            ...TOKENS.ZRX,
        },
        isUnlocked: true,
    },
    {
        balance: new BigNumber(1),
        token: {
            ...tokenDefaults,
            ...TOKENS.MKR,
        },
        isUnlocked: true,
    },
    {
        balance: new BigNumber(1),
        token: {
            ...tokenDefaults,
            ...TOKENS.REP,
        },
        isUnlocked: true,
    },
    {
        balance: new BigNumber(1),
        token: {
            ...tokenDefaults,
            ...TOKENS.DGD,
        },
        isUnlocked: true,
    },
    {
        balance: new BigNumber(1),
        token: {
            ...tokenDefaults,
            ...TOKENS.MLN,
        },
        isUnlocked: true,
    },
];

describe('Buy sell limit steps for zrx/weth', () => {
    it('should create just one buy limit step if base and quote tokens are unlocked', async () => {
        // given
        const baseToken = TOKENS.ZRX;
        const quoteToken = TOKENS.WETH;
        const wethTokenBalance = {
            balance: ZERO,
            token: wethToken,
            isUnlocked: true,
        };
        const amount: BigNumber = ZERO;
        const price: BigNumber = ZERO;
        const side: OrderSide = OrderSide.Buy;
        const makerFee = unitsInTokenAmount('1', 18);
        const makerFeeAssetData = assetDataUtils.encodeERC20AssetData(baseToken.address);

        // when
        const feeData: OrderFeeData = {
            ...DEFAULT_FEE_DATA,
            makerFee,
            makerFeeAssetData,
        };
        const buySellLimitFlow: Step[] = createBuySellLimitSteps(
            baseToken,
            quoteToken,
            tokenBalances,
            wethTokenBalance,
            amount,
            price,
            side,
            feeData,
        );

        // then
        expect(buySellLimitFlow).toHaveLength(1);
        expect(buySellLimitFlow[0].kind).toBe(StepKind.BuySellLimit);
    });
    it('Should create two steps, buy and unlock step if creating a buy limit order for an X/Y market with Y locked', async () => {
        // given
        const baseToken = TOKENS.ZRX;
        const quoteToken = TOKENS.WETH;
        const wethTokenBalance = {
            balance: ZERO,
            token: wethToken,
            isUnlocked: false,
        };
        const amount: BigNumber = ZERO;
        const price: BigNumber = ZERO;
        const side: OrderSide = OrderSide.Buy;
        const makerFee = unitsInTokenAmount('1', 18);
        const makerFeeAssetData = assetDataUtils.encodeERC20AssetData(baseToken.address);

        // when
        const feeData: OrderFeeData = {
            ...DEFAULT_FEE_DATA,
            makerFee,
            makerFeeAssetData,
        };

        // when
        const buySellLimitFlow: Step[] = createBuySellLimitSteps(
            baseToken,
            quoteToken,
            tokenBalances,
            wethTokenBalance,
            amount,
            price,
            side,
            feeData,
        );

        // then
        expect(buySellLimitFlow).toHaveLength(2);
        expect(buySellLimitFlow[0].kind).toBe(StepKind.ToggleTokenLock);
        expect(buySellLimitFlow[1].kind).toBe(StepKind.BuySellLimit);
    });
    it('Should create two steps, buy and unlock step if creating a sell limit order for an X/Y market with X locked', async () => {
        // given
        const baseToken = TOKENS.ZRX;
        const quoteToken = TOKENS.WETH;
        // Base token zrx is locked
        tokenBalances[0].isUnlocked = false;
        const wethTokenBalance = {
            balance: ZERO,
            token: wethToken,
            isUnlocked: true,
        };
        const amount: BigNumber = ZERO;
        const price: BigNumber = ZERO;
        const side: OrderSide = OrderSide.Sell;
        const makerFee = unitsInTokenAmount('1', 18);
        const makerFeeAssetData = assetDataUtils.encodeERC20AssetData(baseToken.address);

        // when
        const feeData: OrderFeeData = {
            ...DEFAULT_FEE_DATA,
            makerFee,
            makerFeeAssetData,
        };

        // when
        const buySellLimitFlow: Step[] = createBuySellLimitSteps(
            baseToken,
            quoteToken,
            tokenBalances,
            wethTokenBalance,
            amount,
            price,
            side,
            feeData,
        );
        // then
        expect(buySellLimitFlow).toHaveLength(2);
        expect(buySellLimitFlow[0].kind).toBe(StepKind.ToggleTokenLock);
        expect(buySellLimitFlow[1].kind).toBe(StepKind.BuySellLimit);
    });
    it('Should create a unlock zrx step if MAKER FEE is positive and if zrx is locked', async () => {
        // given
        const baseToken = TOKENS.MKR;
        const quoteToken = TOKENS.WETH;
        const wethTokenBalance = {
            balance: ZERO,
            token: wethToken,
            isUnlocked: true,
        };
        // Base token zrx is locked
        tokenBalances[0].isUnlocked = false;
        const amount: BigNumber = ZERO;
        const price: BigNumber = ZERO;
        const side: OrderSide = OrderSide.Buy;
        const makerFee = unitsInTokenAmount('1', 18);
        const makerFeeAssetData = assetDataUtils.encodeERC20AssetData(TOKENS.ZRX.address);

        // when
        const feeData: OrderFeeData = {
            ...DEFAULT_FEE_DATA,
            makerFee,
            makerFeeAssetData,
        };

        // when
        const buySellLimitFlow: Step[] = createBuySellLimitSteps(
            baseToken,
            quoteToken,
            tokenBalances,
            wethTokenBalance,
            amount,
            price,
            side,
            feeData,
        );

        // then
        expect(buySellLimitFlow).toHaveLength(2);
        expect(buySellLimitFlow[0].kind).toBe(StepKind.ToggleTokenLock);
        expect(buySellLimitFlow[1].kind).toBe(StepKind.BuySellLimit);
    });
});

describe('Buy sell market steps for zrx/weth', () => {
    it('should create just one buy market step if base and quote tokens are unlocked', async () => {
        // given
        const baseToken = TOKENS.ZRX;
        const quoteToken = TOKENS.WETH;
        // Unlocks base zrx token
        tokenBalances[0].isUnlocked = true;
        const wethTokenBalance = {
            balance: ZERO,
            token: wethToken,
            isUnlocked: true,
        };
        const ethBalance = ZERO;
        const amount: BigNumber = ZERO;
        const side: OrderSide = OrderSide.Buy;
        const amountOfWethNeededForOrders = ZERO;

        // when
        const feeData = DEFAULT_FEE_DATA;

        // when
        const buySellMarketFlow: Step[] = createBuySellMarketSteps(
            baseToken,
            quoteToken,
            tokenBalances,
            wethTokenBalance,
            ethBalance,
            amount,
            side,
            amountOfWethNeededForOrders,
            feeData,
        );

        // then
        expect(buySellMarketFlow).toHaveLength(1);
        expect(buySellMarketFlow[0].kind).toBe(StepKind.BuySellMarket);
    });
    it('Should create a unlock zrx step if TAKER FEE is positive and if zrx is locked', async () => {
        // given
        const baseToken = TOKENS.MKR;
        const quoteToken = TOKENS.WETH;
        const wethTokenBalance = {
            balance: ZERO,
            token: wethToken,
            isUnlocked: true,
        };
        const ethBalance = ZERO;
        // Base token zrx is locked
        tokenBalances[0].isUnlocked = false;
        const amount: BigNumber = ZERO;
        const side: OrderSide = OrderSide.Buy;
        const takerFee = unitsInTokenAmount('1', 18);
        const amountOfWethNeededForOrders = ZERO;
        const takerFeeAssetData = assetDataUtils.encodeERC20AssetData(TOKENS.ZRX.address);

        // when
        const feeData: OrderFeeData = {
            ...DEFAULT_FEE_DATA,
            takerFee,
            takerFeeAssetData,
        };

        // when
        const buySellMarketFlow: Step[] = createBuySellMarketSteps(
            baseToken,
            quoteToken,
            tokenBalances,
            wethTokenBalance,
            ethBalance,
            amount,
            side,
            amountOfWethNeededForOrders,
            feeData,
        );

        // then
        expect(buySellMarketFlow).toHaveLength(2);
        expect(buySellMarketFlow[0].kind).toBe(StepKind.ToggleTokenLock);
        expect(buySellMarketFlow[1].kind).toBe(StepKind.BuySellMarket);
    });
});

describe('Buy sell limit matching steps for zrx/weth', () => {
    it('should create just one buy market step if base and quote tokens are unlocked', async () => {
        // given
        const baseToken = tokenFactory.build({ decimals: 18, symbol: 'zrx' });
        const quoteToken = tokenFactory.build({ decimals: 18, symbol: 'weth' });
        // Unlocks base zrx token
        tokenBalances[0].isUnlocked = true;
        const wethTokenBalance = {
            balance: ZERO,
            token: wethToken,
            isUnlocked: true,
        };
        const ethBalance = new BigNumber(0);
        const amount: BigNumber = new BigNumber(0);
        const side: OrderSide = OrderSide.Buy;
        const amountOfWethNeededForOrders = new BigNumber(0);
        const takerFee = unitsInTokenAmount('1', 18);
        const price = new BigNumber(0);

        // when
        const buySellLimitMatchingFlow: Step[] = createBuySellLimitMatchingSteps(
            baseToken,
            quoteToken,
            tokenBalances,
            wethTokenBalance,
            ethBalance,
            amount,
            side,
            amountOfWethNeededForOrders,
            price,
            takerFee,
        );

        // then
        expect(buySellLimitMatchingFlow).toHaveLength(1);
        expect(buySellLimitMatchingFlow[0].kind).toBe(StepKind.BuySellLimitMatching);
    });
    it('Should create a unlock zrx step if TAKER FEE is positive and if zrx is locked', async () => {
        // given
        const baseToken = tokenFactory.build({ decimals: 18, symbol: 'mkr' });
        const quoteToken = tokenFactory.build({ decimals: 18, symbol: 'weth' });
        const wethTokenBalance = {
            balance: ZERO,
            token: wethToken,
            isUnlocked: true,
        };
        const ethBalance = new BigNumber(0);
        // Base token zrx is locked
        tokenBalances[0].isUnlocked = false;
        const amount: BigNumber = new BigNumber(0);
        const side: OrderSide = OrderSide.Buy;
        const takerFee = unitsInTokenAmount('1', 18);
        const amountOfWethNeededForOrders = new BigNumber(0);
        const price = new BigNumber(0);
        // when
        const buySellLimitMatchingFlow: Step[] = createBuySellLimitMatchingSteps(
            baseToken,
            quoteToken,
            tokenBalances,
            wethTokenBalance,
            ethBalance,
            amount,
            side,
            amountOfWethNeededForOrders,
            price,
            takerFee,
        );

        // then
        expect(buySellLimitMatchingFlow).toHaveLength(2);
        expect(buySellLimitMatchingFlow[0].kind).toBe(StepKind.ToggleTokenLock);
        expect(buySellLimitMatchingFlow[1].kind).toBe(StepKind.BuySellLimitMatching);
    });
});

describe('getUnlockTokenStepIfNeeded', () => {
    it('if the token is locked, should return a toggle lock step', async () => {
        // given
        const lockedToken = TOKENS.MKR;
        // locks mkr token
        tokenBalances[1].isUnlocked = false;
        const wethTokenBalance = {
            balance: ZERO,
            token: wethToken,
            isUnlocked: true,
        };

        // when
        const unlockStep: StepToggleTokenLock | null = getUnlockTokenStepIfNeeded(
            lockedToken,
            tokenBalances,
            wethTokenBalance,
        );
        // then
        expect(unlockStep).not.toBeNull();
        if (unlockStep) {
            expect(unlockStep.kind).toBe(StepKind.ToggleTokenLock);
        }
    });
    it('if the token is unlocked, should return null', async () => {
        // given
        const lockedToken = TOKENS.MKR;
        // unlock mkr token
        tokenBalances[1].isUnlocked = true;
        const wethTokenBalance = {
            balance: ZERO,
            token: wethToken,
            isUnlocked: true,
        };

        // when
        const unlockStep: StepToggleTokenLock | null = getUnlockTokenStepIfNeeded(
            lockedToken,
            tokenBalances,
            wethTokenBalance,
        );
        // then
        expect(unlockStep).toBeNull();
    });
});

describe('getWrapEthStepIfNeeded', () => {
    it('if the weth balance is less than the amount multiplied by price, should return a wrap eth step', async () => {
        // given
        const wethTokenBalance = {
            balance: ZERO,
            token: wethToken,
            isUnlocked: true,
        };
        const amount: BigNumber = new BigNumber(10);
        const price: BigNumber = new BigNumber(1);
        const side: OrderSide = OrderSide.Buy;

        // when
        const stepWrapEth: StepWrapEth | null = getWrapEthStepIfNeeded(amount, price, side, wethTokenBalance);

        // then
        expect(stepWrapEth).not.toBeNull();
        if (stepWrapEth) {
            expect(stepWrapEth.kind).toBe(StepKind.WrapEth);
        }
    });
    it('if the weth balance is bigger than the amount multiplied by price, should not return a wrap eth step', async () => {
        // given
        const wethTokenBalance = {
            balance: new BigNumber(11),
            token: wethToken,
            isUnlocked: true,
        };
        const amount: BigNumber = new BigNumber(10);
        const price: BigNumber = new BigNumber(1);
        const side: OrderSide = OrderSide.Buy;

        // when
        const stepWrapEth: StepWrapEth | null = getWrapEthStepIfNeeded(amount, price, side, wethTokenBalance);

        // then
        expect(stepWrapEth).toBeNull();
    });
    it('If creating sell order, should not return a wrap eth step', async () => {
        // given
        const wethTokenBalance = {
            balance: new BigNumber(11),
            token: wethToken,
            isUnlocked: true,
        };
        const amount: BigNumber = new BigNumber(10);
        const price: BigNumber = new BigNumber(1);
        const side: OrderSide = OrderSide.Sell;

        // when
        const stepWrapEth: StepWrapEth | null = getWrapEthStepIfNeeded(amount, price, side, wethTokenBalance);

        // then
        expect(stepWrapEth).toBeNull();
    });
});

describe('getUnlockZrxStepIfNeeded', () => {
    it('should return toggle lock step for zrx if zrx is locked', async () => {
        // given
        // Locks zrx
        tokenBalances[0].isUnlocked = false;

        // when
        const stepLockZrx: StepToggleTokenLock | null = getUnlockZrxStepIfNeeded(tokenBalances);

        // then
        expect(stepLockZrx).not.toBeNull();
        if (stepLockZrx) {
            expect(stepLockZrx.kind).toBe(StepKind.ToggleTokenLock);
        }
    });
    it('should return null if zrx is locked', async () => {
        // given
        // Unlocks zrx
        tokenBalances[0].isUnlocked = true;

        // when
        const stepLockZrx: StepToggleTokenLock | null = getUnlockZrxStepIfNeeded(tokenBalances);

        // then
        expect(stepLockZrx).toBeNull();
    });
});
