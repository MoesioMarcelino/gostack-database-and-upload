import csvParse from 'csv-parse';
import fs from 'fs';
import { getCustomRepository, getRepository, In } from 'typeorm';
import AppError from '../errors/AppError';
import Category from '../models/Category';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}
class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const categoriesRepository = getRepository(Category);
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const contactsReadStream = fs.createReadStream(filePath);

    const parsers = csvParse({
      from_line: 2,
    });

    const parseCSV = contactsReadStream.pipe(parsers);

    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !type || !value) {
        throw new AppError('CSV Invalid');
      }

      categories.push(category);
      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    // Verifica das categorias enviadas no CSV, se alguma já existe no banco e retorna um array
    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });

    // Busca apenas os títulos das categorias existentes
    const existentCategoriesTitle = existentCategories.map(
      (category: Category) => category.title,
    );

    // Retorna para um array todas as categorias que não existem no banco ainda
    // E remove categorias repetidas
    const addCategoryTitles = categories
      .filter(category => !existentCategoriesTitle.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    // Cria as novas categorias
    const newCategories = categoriesRepository.create(
      addCategoryTitles.map(title => ({ title })),
    );

    // Salva as novas categorias
    await categoriesRepository.save(newCategories);

    // Guarda todas as categorias nessa constante
    const finalCategories = [...newCategories, ...existentCategories];

    // Cria as transações
    const createdTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    // Salva as transações
    await transactionsRepository.save(createdTransactions);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
