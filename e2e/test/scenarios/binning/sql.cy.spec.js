import { SAMPLE_DB_ID } from "e2e/support/cypress_data";
import {
  cartesianChartCircle,
  changeBinningForDimension,
  chartPathWithFillColor,
  echartsContainer,
  openTable,
  restore,
  snapshot,
  summarize,
  tableHeaderClick,
  visitQuestionAdhoc,
  visualize,
} from "e2e/support/helpers";

const questionDetails = {
  name: "SQL Binning",
  native: {
    query:
      "SELECT ORDERS.CREATED_AT, ORDERS.TOTAL, PEOPLE.LONGITUDE FROM ORDERS JOIN PEOPLE ON orders.user_id = people.id",
  },
};

let questionId;

describe("scenarios > binning > from a saved sql question", () => {
  before(() => {
    restore();
    cy.signInAsAdmin();

    cy.createNativeQuestion(questionDetails, {
      loadMetadata: true,
      wrapId: true,
    });

    cy.get("@questionId").then(id => (questionId = id));

    snapshot("binningSql");
  });

  beforeEach(() => {
    cy.intercept("POST", "/api/dataset").as("dataset");

    restore("binningSql");
    cy.signInAsAdmin();
  });

  context("via simple question", () => {
    beforeEach(() => {
      openTable({
        database: SAMPLE_DB_ID,
        table: `card__${questionId}`,
        mode: "notebook",
      });

      visualize();
      cy.findByTextEnsureVisible("LONGITUDE");
      summarize();
    });

    it("should work for time series", () => {
      /*
       * If `result_metadata` is not loaded (SQL question is not run before saving),
       * the granularity is much finer and one can see "by minute" as the default bucket (metabase#16671).
       */
      changeBinningForDimension({
        name: "CREATED_AT",
        fromBinning: "by month",
        toBinning: "Year",
      });

      waitAndAssertOnRequest("@dataset");

      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Count by CREATED_AT: Year");
      cartesianChartCircle();
    });

    it("should work for number", () => {
      changeBinningForDimension({
        name: "TOTAL",
        fromBinning: "Auto bin",
        toBinning: "50 bins",
      });

      waitAndAssertOnRequest("@dataset");

      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Count by TOTAL: 50 bins");
      chartPathWithFillColor("#509EE3");
    });

    it("should work for longitude", () => {
      changeBinningForDimension({
        name: "LONGITUDE",
        fromBinning: "Auto bin",
        toBinning: "Bin every 10 degrees",
      });

      waitAndAssertOnRequest("@dataset");

      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Count by LONGITUDE: 10°");
      chartPathWithFillColor("#509EE3");
    });
  });

  context("via custom question", () => {
    beforeEach(() => {
      visitQuestionAdhoc(
        {
          dataset_query: {
            database: SAMPLE_DB_ID,
            type: "query",
            query: {
              "source-table": `card__${questionId}`,
              aggregation: [["count"]],
            },
          },
        },
        { mode: "notebook" },
      );
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Summarize").click();
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Pick a column to group by").click();
    });

    it("should work for time series", () => {
      changeBinningForDimension({
        name: "CREATED_AT",
        fromBinning: "by month",
        toBinning: "Year",
      });

      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Count by CREATED_AT: Year");

      visualize(response => {
        assertOnResponse(response);
      });

      cartesianChartCircle();
    });

    it("should work for number", () => {
      changeBinningForDimension({
        name: "TOTAL",
        fromBinning: "Auto bin",
        toBinning: "50 bins",
      });

      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Count by TOTAL: 50 bins");

      visualize(response => {
        assertOnResponse(response);
      });

      chartPathWithFillColor("#509EE3");
    });

    it("should work for longitude", () => {
      changeBinningForDimension({
        name: "LONGITUDE",
        fromBinning: "Auto bin",
        toBinning: "Bin every 10 degrees",
      });

      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Count by LONGITUDE: 10°");

      visualize(response => {
        assertOnResponse(response);
      });

      chartPathWithFillColor("#509EE3");
    });
  });

  context("via column popover", () => {
    beforeEach(() => {
      openTable({
        database: SAMPLE_DB_ID,
        table: `card__${questionId}`,
      });
      cy.findByTextEnsureVisible("LONGITUDE");
    });

    it("should work for time series", () => {
      tableHeaderClick("CREATED_AT");
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Distribution").click();

      assertOnXYAxisLabels({ xLabel: "CREATED_AT", yLabel: "Count" });
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Count by CREATED_AT: Month");
      cartesianChartCircle();

      // Open a popover with bucket options from the time series footer
      cy.findByTestId("timeseries-bucket-button").contains("Month").click();
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Quarter").click();

      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Count by CREATED_AT: Quarter");
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Q1 2023");
    });

    it("should work for number", () => {
      tableHeaderClick("TOTAL");
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Distribution").click();

      assertOnXYAxisLabels({ xLabel: "TOTAL", yLabel: "Count" });
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Count by TOTAL: Auto binned");
      chartPathWithFillColor("#509EE3");
    });

    it("should work for longitude", () => {
      tableHeaderClick("LONGITUDE");
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Distribution").click();

      assertOnXYAxisLabels({ xLabel: "LONGITUDE", yLabel: "Count" });
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Count by LONGITUDE: Auto binned");
      chartPathWithFillColor("#509EE3");
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("170° W");
    });
  });
});

function assertOnXYAxisLabels({ xLabel, yLabel } = {}) {
  echartsContainer().get("text").contains(xLabel);

  echartsContainer().get("text").contains(yLabel);
}

function waitAndAssertOnRequest(requestAlias) {
  cy.wait(requestAlias).then(({ response }) => {
    assertOnResponse(response);
  });
}

function assertOnResponse(response) {
  expect(response.body.error).to.not.exist;
}
