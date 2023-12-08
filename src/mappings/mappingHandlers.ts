import assert from "assert";
import {
  ClaimableRoundLog,
  CreateMarketLog,
  DepositLog,
  HighLog,
  LowLog,
  NewRoundLog,
  PositionErrorLog,
  SetProtocolFeeLog,
  SettlePositionLog,
  SettleRoundLog,
  WithdrawalLog,
} from "../types/abi-interfaces/ControllerAbi";
import { Deposit, Market, Position, Round, Withdrawal } from "../types/models";
import { getAccount, getBalance, getOrCreatePosition } from "../utils";
import { Option, StatusCode } from "../types";

export async function handleClaimableRound(
  log: ClaimableRoundLog
): Promise<void> {
  assert(log.args, "No log.args");

  let roundId = log.args.id.concat("-").concat(log.args.roundId.toString());
  let round = await Round.get(roundId);

  if (round) {
    round.isFinalized = true;
    round.totalWinningStake = log.args.totalWinningStake.toBigInt();
    round.save();
  }
}

export async function handleCreateMarket(log: CreateMarketLog): Promise<void> {
  assert(log.args, "No log.args");

  let market = await Market.get(log.args.marketId);

  if (!market) {
    market = Market.create({
      id: log.args.marketId,
      oracleId: log.args.oracleId,
      currency: log.args.currency,
      protocolFee: BigInt(log.args.protocolFee),
      deadline: log.args.deadline.toBigInt(),
      duration: log.args.duration.toBigInt(),
      volume: BigInt(0),
      highVolume: BigInt(0),
      lowVolume: BigInt(0),
      paused: false,
      roundCount: BigInt(0),
    });

    await market.save();
  }
}

export async function handleDeposit(log: DepositLog): Promise<void> {
  assert(log.args, "No log.args");

  let deposit = await Deposit.get(log.args.requestId);
  let account = await getAccount(log.args.account);
  let balance = await getBalance(account.id, log.args.currency);

  if (!deposit) {
    deposit = Deposit.create({
      id: log.args.requestId,
      accountId: account.id,
      amount: log.args.amount.toBigInt(),
      createdAt: log.block.timestamp,
      currency: log.args.currency,
      isCompleted: true,
    });
  }

  balance.balance += log.args.amount.toBigInt();
  balance.save();

  deposit.isCompleted = true;
  deposit.updatedAt = log.block.timestamp;
  deposit.save();
}

export async function handleHigh(log: HighLog): Promise<void> {
  assert(log.args, "No log.args");

  let market = await Market.get(log.args.id);
  let roundId = log.args.id.concat("-").concat(log.args.roundId.toString());
  let round = await Round.get(roundId);
  let stake = log.args.stake.toBigInt();

  if (market && round) {
    let { position, prevOption, prevStake } = await getOrCreatePosition(
      log,
      Option.HIGH
    );

    round.totalStake += stake;
    market.volume += stake;
    market.highVolume += stake;

    if (prevOption && prevStake) {
      round.totalStake -= prevStake;
      if (prevOption == Option.LOW) {
        market.lowVolume -= prevStake;
      } else {
        market.highVolume -= prevStake;
      }
    }

    let balance = await getBalance(position.accountId, market.currency);

    position.isOpen = true;
    position.option = Option.HIGH;
    position.stake = stake;
    balance.balance -= stake;

    round.totalStake += stake;
    market.lowVolume += stake;

    balance.save();
    round.save();
    market.save();
    position.save();
  }
}

export async function handleLow(log: LowLog): Promise<void> {
  assert(log.args, "No log.args");

  let market = await Market.get(log.args.id);
  let roundId = log.args.id.concat("-").concat(log.args.roundId.toString());
  let round = await Round.get(roundId);
  let stake = log.args.stake.toBigInt();

  if (market && round) {
    let { position, prevOption, prevStake } = await getOrCreatePosition(
      log,
      Option.LOW
    );

    round.totalStake += stake;
    market.volume += stake;
    market.lowVolume += stake;

    if (prevOption && prevStake) {
      round.totalStake -= prevStake;
      if (prevOption == Option.LOW) {
        market.lowVolume -= prevStake;
      } else {
        market.highVolume -= prevStake;
      }
    }

    let balance = await getBalance(position.accountId, market.currency);

    position.isOpen = true;
    position.option = Option.HIGH;
    position.stake = stake;
    balance.balance -= stake;

    round.totalStake += stake;
    market.lowVolume += stake;

    balance.save();
    round.save();
    market.save();
    position.save();
  }
}

export async function handleNewRound(log: NewRoundLog): Promise<void> {
  assert(log.args, "No log.args");

  let market = await Market.get(log.args.id);

  if (market) {
    let roundId = log.args.id.concat("-").concat(log.args.roundId.toString());

    let round = Round.create({
      id: roundId,
      closingTime: log.args.closingTime.toBigInt(),
      entryDeadline: log.args.entryDeadline.toBigInt(),
      isFinalized: false,
      marketId: market.id,
      openingTime: log.args.openingTime.toBigInt(),
      rewardPool: BigInt(0),
      totalStake: BigInt(0),
      totalWinningStake: BigInt(0),
    });

    round.save();

    market.roundCount += BigInt(1);
    market.save();
  }
}

export async function handlePositionError(
  log: PositionErrorLog
): Promise<void> {
  assert(log.args, "No log.args");

  let position = await Position.get(log.args.positionId);

  if (position) {
    position.status = Object.values(StatusCode)[log.args.errorCode];
    position.save();
  }
}

export async function handleSetProtocolFee(
  log: SetProtocolFeeLog
): Promise<void> {
  assert(log.args, "No log.args");

  let market = await Market.get(log.args.id);

  if (market) {
    market.protocolFee = BigInt(log.args.newFee);
    market.save();
  }
}

export async function handleSettlePosition(
  log: SettlePositionLog
): Promise<void> {
  assert(log.args, "No log.args");

  let position = await Position.get(log.args.positionId);

  if (position) {
    position.rewardAmountClaimed = log.args.amount.toBigInt();
    position.isOpen = false;
    position.isRewardClaimed = true;

    position.save();

    let market = await Market.get(position.marketId);

    if (market) {
      let balance = await getBalance(log.args.account, market.currency);
      balance.balance += log.args.amount.toBigInt();

      balance.save();
    }
  }
}

export async function handleSettleRound(log: SettleRoundLog): Promise<void> {
  assert(log.args, "No log.args");

  let id = log.args.id.concat("-").concat(log.args.roundId.toString());
  let round = await Round.get(id);

  if (round) {
    round.closingPrice = log.args.closingPrice.toBigInt();
    round.totalStake = log.args.totalStake.toBigInt();

    round.save();
  }
}

export async function handleWithdrawal(log: WithdrawalLog): Promise<void> {
  assert(log.args, "No log.args");

  let balance = await getBalance(log.args.account, log.args.currency);
  let withdrawal = await Withdrawal.get(log.args.requestId);

  if (!withdrawal) {
    withdrawal = Withdrawal.create({
      id: log.args.requestId,
      accountId: log.args.account,
      amount: log.args.amount.toBigInt(),
      requestedOn: log.block.timestamp,
      isCompleted: true,
    });
  }

  balance.balance -= log.args.amount.toBigInt();
  balance.save();

  withdrawal.completedOn = log.block.timestamp;
  withdrawal.isCompleted = true;
  withdrawal.save();
}
