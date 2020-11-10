import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Category from '../models/Category';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const { total } = await transactionsRepository.getBalance();

    if (type === 'outcome' && total < value) {
      throw new AppError('Income value invalid', 400);
    }

    const categoryExisting = await categoriesRepository.findOne({
      where: { title: category },
    });

    let transaction;

    if (categoryExisting) {
      transaction = transactionsRepository.create({
        category_id: categoryExisting.id,
        title,
        type,
        value,
      });
    } else {
      const newCategory = categoriesRepository.create({ title: category });

      await categoriesRepository.save(newCategory);

      transaction = transactionsRepository.create({
        category_id: newCategory.id,
        title,
        type,
        value,
      });
    }

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
