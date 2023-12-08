import assert from "assert";
import {
  DepositLog,
  HighLog,
  LowLog,
  WithdrawalLog,
} from "../types/abi-interfaces/ControllerAbi";
import {
  Account,
  Balance,
  Deposit,
  Position,
  Withdrawal,
} from "../types/models";
import { Option, StatusCode } from "../types";

export async function getAccount(address: string): Promise<Account> {
  let account = await Account.get(address);

  if (account != null) {
    return account;
  }

  account = Account.create({
    id: address,
  });

  await account.save();

  return account;
}

export const generateRoundId = (marketId: string, roundId: string): string =>
  `${marketId}-${roundId}`;

export async function getOrCreateDeposit(log: DepositLog): Promise<Deposit> {
  assert(log.args, "No Logs");

  const depositId = log.args.requestId;
  let deposit = await Deposit.get(depositId);

  if (!deposit) {
    deposit = Deposit.create({
      id: depositId,
      accountId: log.args.account,
      currency: log.args.currency,
      amount: log.args.amount.toBigInt(),
      isCompleted: false,
      createdAt: log.block.timestamp,
    });
  }

  return deposit;
}

export async function getOrCreateWithdrawal(
  log: WithdrawalLog
): Promise<Withdrawal> {
  assert(log.args, "No Logs");

  const withdrawalId = log.args.requestId;
  let withdrawal = await Withdrawal.get(withdrawalId);

  if (!withdrawal) {
    withdrawal = Withdrawal.create({
      id: withdrawalId,
      accountId: log.args.account,
      amount: log.args.amount.toBigInt(),
      requestedOn: log.block.timestamp,
      isCompleted: false,
    });
  }

  return withdrawal;
}

export async function getOrCreatePosition(
  log: HighLog | LowLog,
  option: Option
): Promise<{
  position: Position;
  prevStake?: bigint | undefined;
  prevOption?: Option | undefined;
}> {
  assert(log.args, "No logs");

  let position = await Position.get(log.args.positionId);
  const prevStake = position?.stake;
  const prevOption = position?.option;

  if (!position) {
    position = Position.create({
      id: log.args.positionId,
      accountId: log.args.account,
      marketId: log.args.id,
      roundId: log.args.roundId.toString(),
      price: log.args.price.toBigInt(),
      option: option,
      stake: log.args.stake.toBigInt(),
      isRewardClaimed: false,
      isOpen: false,
      status: StatusCode.IN_PROGRESS,
      createdAt: log.block.timestamp,
    });
  }

  return { position, prevStake, prevOption };
}

export async function getBalance(
  owner: string,
  currency: string
): Promise<Balance> {
  let id = owner.concat("-").concat(currency);
  let balance = await Balance.get(id);

  if (!balance) {
    balance = Balance.create({
      id: id,
      accountId: owner,
      balance: BigInt(0),
      currency: currency,
    });
  }

  return balance;
}
