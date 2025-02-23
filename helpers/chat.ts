import RequestyServiceClient, {
  RequestyModelEnum,
} from "./RequestyServiceClient";

import Database from "./Db";
import { FinancialsDataManager } from "./bigQuery";
import StockFinancials from "./StockFinancials";

class EarningsProcessor {
  private static getTickersFromCsv(): string[] {
    const fs = require("fs");
    const csvContent = fs.readFileSync("tickers.csv", "utf-8");
    return csvContent
      .split("\n")
      .slice(1) // Skip header row
      .map((line) => line.trim()) // Get ticker from line
      .filter((ticker) => ticker && ticker.length > 0); // Remove empty lines
  }

  async processAndSaveEarningsForOneStock(ticker: string) {
    await StockFinancials.downloadFinancials(ticker);
  }

  async processAndSaveEarningsForAllStocks() {
    const tickers = EarningsProcessor.getTickersFromCsv();
    await StockFinancials.downloadFinancialsForTickerList(tickers);
  }

  async updateAllFinancials() {
    const tickers = EarningsProcessor.getTickersFromCsv();
    await StockFinancials.downloadFinancialsForTickerList(tickers);
  }
}

class QueryProcessor {
  private requestyClient: RequestyServiceClient;
  private financialsManager: FinancialsDataManager;

  constructor() {
    this.requestyClient = new RequestyServiceClient();
    this.financialsManager = new FinancialsDataManager(
      FinancialsDataManager.quarterlyTableId
    );
  }

  async processNaturalLanguageQuery(question: string) {
    // 1. Convert natural language to SQL using Requesty
    const systemPrompt = `You are an expert at writing BigQuery SQL queries.
    
# Financials Table Schema (\`financials.quarterly\`)
    [
  {
    "name": "ticker",
    "type": "STRING",
  },
  {
    "name": "symbol",
    "type": "STRING",
  },
  {
    "name": "date",
    "type": "TIMESTAMP",
  },
  {
    "name": "accountsPayable",
    "type": "FLOAT",
  },
  {
    "name": "accumulatedOtherComprehensiveIncome",
    "type": "FLOAT",
  },
  {
    "name": "beginPeriodCashFlow",
    "type": "FLOAT",
  },
  {
    "name": "capitalExpenditures",
    "type": "FLOAT",
  },
  {
    "name": "capitalStock",
    "type": "FLOAT",
  },
  {
    "name": "cash",
    "type": "FLOAT",
  },
  {
    "name": "cashAndShortTermInvestments",
    "type": "FLOAT",
  },
  {
    "name": "changeInCash",
    "type": "FLOAT",
  },
  {
    "name": "changeInWorkingCapital",
    "type": "FLOAT",
  },
  {
    "name": "changeToAccountReceivables",
    "type": "FLOAT",
  },
  {
    "name": "changeToInventory",
    "type": "FLOAT",
  },
  {
    "name": "commonStock",
    "type": "FLOAT",
  },
  {
    "name": "commonStockSharesOutstanding",
    "type": "FLOAT",
  },
  {
    "name": "costOfRevenue",
    "type": "FLOAT",
  },
  {
    "name": "currentDeferredRevenue",
    "type": "FLOAT",
  },
  {
    "name": "depreciation",
    "type": "FLOAT",
  },
  {
    "name": "dividendsPaid",
    "type": "FLOAT",
  },
  {
    "name": "ebitda",
    "type": "FLOAT",
  },
  {
    "name": "endPeriodCashFlow",
    "type": "FLOAT",
  },
  {
    "name": "freeCashFlow",
    "type": "FLOAT",
  },
  {
    "name": "grossProfit",
    "type": "FLOAT",
  },
  {
    "name": "incomeBeforeTax",
    "type": "FLOAT",
  },
  {
    "name": "incomeTaxExpense",
    "type": "FLOAT",
  },
  {
    "name": "inventory",
    "type": "FLOAT",
  },
  {
    "name": "investments",
    "type": "FLOAT",
  },
  {
    "name": "liabilitiesAndStockholdersEquity",
    "type": "FLOAT",
  },
  {
    "name": "longTermDebt",
    "type": "FLOAT",
  },
  {
    "name": "longTermInvestments",
    "type": "FLOAT",
  },
  {
    "name": "netDebt",
    "type": "FLOAT",
  },
  {
    "name": "netIncome",
    "type": "FLOAT",
  },
  {
    "name": "netIncomeFromContinuingOps",
    "type": "FLOAT",
  },
  {
    "name": "netInvestedCapital",
    "type": "FLOAT",
  },
  {
    "name": "netReceivables",
    "type": "FLOAT",
  },
  {
    "name": "netWorkingCapital",
    "type": "FLOAT",
  },
  {
    "name": "nonCurrentAssetsTotal",
    "type": "FLOAT",
  },
  {
    "name": "nonCurrentLiabilitiesOther",
    "type": "FLOAT",
  },
  {
    "name": "nonCurrentLiabilitiesTotal",
    "type": "FLOAT",
  },
  {
    "name": "nonCurrrentAssetsOther",
    "type": "FLOAT",
  },
  {
    "name": "operatingIncome",
    "type": "FLOAT",
  },
  {
    "name": "otherCashflowsFromFinancingActivities",
    "type": "FLOAT",
  },
  {
    "name": "otherCashflowsFromInvestingActivities",
    "type": "FLOAT",
  },
  {
    "name": "otherCurrentAssets",
    "type": "FLOAT",
  },
  {
    "name": "otherCurrentLiab",
    "type": "FLOAT",
  },
  {
    "name": "otherNonCashItems",
    "type": "FLOAT",
  },
  {
    "name": "otherOperatingExpenses",
    "type": "FLOAT",
  },
  {
    "name": "propertyPlantAndEquipmentGross",
    "type": "FLOAT",
  },
  {
    "name": "propertyPlantAndEquipmentNet",
    "type": "FLOAT",
  },
  {
    "name": "reconciledDepreciation",
    "type": "FLOAT",
  },
  {
    "name": "researchDevelopment",
    "type": "FLOAT",
  },
  {
    "name": "retainedEarnings",
    "type": "FLOAT",
  },
  {
    "name": "salePurchaseOfStock",
    "type": "FLOAT",
  },
  {
    "name": "sellingGeneralAdministrative",
    "type": "FLOAT",
  },
  {
    "name": "shortLongTermDebt",
    "type": "FLOAT",
  },
  {
    "name": "shortLongTermDebtTotal",
    "type": "FLOAT",
  },
  {
    "name": "shortTermDebt",
    "type": "FLOAT",
  },
  {
    "name": "shortTermInvestments",
    "type": "FLOAT",
  },
  {
    "name": "stockBasedCompensation",
    "type": "FLOAT",
  },
  {
    "name": "taxProvision",
    "type": "FLOAT",
  },
  {
    "name": "totalAssets",
    "type": "FLOAT",
  },
  {
    "name": "totalCashFromFinancingActivities",
    "type": "FLOAT",
  },
  {
    "name": "totalCashFromOperatingActivities",
    "type": "FLOAT",
  },
  {
    "name": "totalCurrentAssets",
    "type": "FLOAT",
  },
  {
    "name": "totalCurrentLiabilities",
    "type": "FLOAT",
  },
  {
    "name": "totalLiab",
    "type": "FLOAT",
  },
  {
    "name": "totalOperatingExpenses",
    "type": "FLOAT",
  },
  {
    "name": "totalOtherIncomeExpenseNet",
    "type": "FLOAT",
  },
  {
    "name": "totalRevenue",
    "type": "FLOAT",
  },
  {
    "name": "totalStockholderEquity",
    "type": "FLOAT",
  },
  {
    "name": "depreciationAndAmortization",
    "type": "FLOAT",
  },
  {
    "name": "ebit",
    "type": "FLOAT",
  },
  {
    "name": "otherStockholderEquity",
    "type": "FLOAT",
  },
  {
    "name": "interestExpense",
    "type": "FLOAT",
  },
  {
    "name": "capitalLeaseObligations",
    "type": "FLOAT",
  },
  {
    "name": "capitalSurpluse",
    "type": "FLOAT",
  },
  {
    "name": "cashAndCashEquivalentsChanges",
    "type": "FLOAT",
  },
  {
    "name": "cashAndEquivalents",
    "type": "FLOAT",
  },
  {
    "name": "changeReceivables",
    "type": "FLOAT",
  },
  {
    "name": "interestIncome",
    "type": "FLOAT",
  },
  {
    "name": "longTermDebtTotal",
    "type": "FLOAT",
  },
  {
    "name": "netIncomeApplicableToCommonShares",
    "type": "FLOAT",
  },
  {
    "name": "netInterestIncome",
    "type": "FLOAT",
  },
  {
    "name": "nonOperatingIncomeNetOther",
    "type": "FLOAT",
  },
  {
    "name": "otherAssets",
    "type": "FLOAT",
  },
  {
    "name": "propertyPlantEquipment",
    "type": "FLOAT",
  },
  {
    "name": "totalCashflowsFromInvestingActivities",
    "type": "FLOAT",
  },
  {
    "name": "accumulatedDepreciation",
    "type": "FLOAT",
  },
  {
    "name": "cashFlowsOtherOperating",
    "type": "FLOAT",
  },
  {
    "name": "changeToLiabilities",
    "type": "FLOAT",
  },
  {
    "name": "changeToNetincome",
    "type": "FLOAT",
  },
  {
    "name": "changeToOperatingActivities",
    "type": "FLOAT",
  },
  {
    "name": "commonStockTotalEquity",
    "type": "FLOAT",
  },
  {
    "name": "netBorrowings",
    "type": "FLOAT",
  },
  {
    "name": "netTangibleAssets",
    "type": "FLOAT",
  },
  {
    "name": "otherLiab",
    "type": "FLOAT",
  },
  {
    "name": "retainedEarningsTotalEquity",
    "type": "FLOAT",
  },
  {
    "name": "issuanceOfCapitalStock",
    "type": "FLOAT",
  },
  {
    "name": "additionalPaidInCapital",
    "type": "FLOAT",
  },
  {
    "name": "deferredLongTermLiab",
    "type": "FLOAT",
  },
  {
    "name": "discontinuedOperations",
    "type": "FLOAT",
  },
  {
    "name": "effectOfAccountingCharges",
    "type": "FLOAT",
  },
  {
    "name": "extraordinaryItems",
    "type": "FLOAT",
  },
  {
    "name": "goodWill",
    "type": "FLOAT",
  },
  {
    "name": "minorityInterest",
    "type": "FLOAT",
  },
  {
    "name": "nonRecurring",
    "type": "FLOAT",
  },
  {
    "name": "noncontrollingInterestInConsolidatedEntity",
    "type": "FLOAT",
  },
  {
    "name": "otherItems",
    "type": "FLOAT",
  },
  {
    "name": "preferredStockTotalEquity",
    "type": "FLOAT",
  },
  {
    "name": "temporaryEquityRedeemableNoncontrollingInterests",
    "type": "FLOAT",
  },
  {
    "name": "totalPermanentEquity",
    "type": "FLOAT",
  },
  {
    "name": "treasuryStock",
    "type": "FLOAT",
  },
  {
    "name": "intangibleAssets",
    "type": "FLOAT",
  },
  {
    "name": "sellingAndMarketingExpenses",
    "type": "FLOAT",
  },
  {
    "name": "warrants",
    "type": "FLOAT",
  },
  {
    "name": "accumulatedAmortization",
    "type": "FLOAT",
  },
  {
    "name": "deferredLongTermAssetCharges",
    "type": "FLOAT",
  },
  {
    "name": "exchangeRateChanges",
    "type": "FLOAT",
  },
  {
    "name": "negativeGoodwill",
    "type": "FLOAT",
  },
  {
    "name": "preferredStockAndOtherAdjustments",
    "type": "FLOAT",
  },
  {
    "name": "preferredStockRedeemable",
    "type": "FLOAT",
  },
  {
    "name": "earningAssets",
    "type": "FLOAT",
  }
]
  
    The database has a table called 'financials.quarterly' with the above columns.
    Respond only with the SQL query, no explanation.
    The query should be valid BigQuery SQL.

    `;

    const response = await this.requestyClient.sendRequest({
      systemPrompt,
      model: RequestyModelEnum.geminiFlash2,
      temperature: 1,
      messages: [
        {
          sender: "User",
          content: `Convert this question to a SQL query: ${question}`,
        },
      ],
      userId: "system",
    });

    const sqlQuery = response.choices[0].message?.content?.trim();
    if (!sqlQuery) {
      throw new Error("No SQL query generated");
    }
    console.log("Generated SQL Query:", sqlQuery);

    // 3. Execute the query against BigQuery
    try {
      const results = await this.financialsManager.executeQuery(sqlQuery);
      return results;
    } catch (error) {
      console.error("Error executing query:", error);
      throw error;
    }
  }
}

(async () => {
  try {
    const cloud = new Database("local");
    await cloud.connect();
    console.log("Connected to database");
    const startTime = new Date();
    const processor = new EarningsProcessor();
    await processor.processAndSaveEarningsForAllStocks();
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    console.log(
      `Processing complete. Files have been saved. Time taken: ${duration}ms`
    );

    const queryProcessor = new QueryProcessor();
    const results = await queryProcessor.processNaturalLanguageQuery(
      "What AI stocks have the highest revenue"
    );

    console.log("Query Results:", results);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
})();
