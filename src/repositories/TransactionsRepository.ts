import { EntityRepository, getCustomRepository, Repository } from 'typeorm';
import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const transactions = await transactionsRepository.find();

    let income = 0;
    let outcome = 0;

    transactions.forEach(transaction => {
      const { type, value } = transaction;

      if (type === 'income') {
        income += value;
      } else {
        outcome += value;
      }
    });

    const balance = {
      income,
      outcome,
      total: income - outcome,
    };

    return balance;
  }
}

export default TransactionsRepository;
