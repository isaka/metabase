import { SAMPLE_DATABASE } from "e2e/support/cypress_sample_database";
import {
  createNativeQuestion,
  tableInteractiveBody,
} from "e2e/support/helpers";
import { mountInteractiveQuestion } from "e2e/support/helpers/embedding-sdk-component-testing";
import { signInAsAdminAndEnableEmbeddingSdk } from "e2e/support/helpers/embedding-sdk-testing";
import { mockAuthProviderAndJwtSignIn } from "e2e/support/helpers/embedding-sdk-testing/embedding-sdk-helpers";
import type { DatasetColumn } from "metabase-types/api";

const { ORDERS, ORDERS_ID } = SAMPLE_DATABASE;

describe("scenarios > embedding-sdk > interactive-question > native", () => {
  beforeEach(() => {
    signInAsAdminAndEnableEmbeddingSdk();

    createNativeQuestion(
      {
        native: {
          query: "SELECT * FROM orders WHERE {{ID}}",
          "template-tags": {
            ID: {
              id: "6b8b10ef-0104-1047-1e1b-2492d5954322",
              name: "ID",
              "display-name": "ID",
              type: "dimension",
              dimension: ["field", ORDERS.ID, null],
              "widget-type": "category",
              default: null,
            },
          },
        },
      },
      { wrapId: true },
    );

    cy.signOut();
    mockAuthProviderAndJwtSignIn();
  });

  it("supports passing sql parameters to native questions", () => {
    mountInteractiveQuestion({ initialSqlParameters: { ID: ORDERS_ID } });

    cy.wait("@cardQuery").then(({ response }) => {
      const { body } = response ?? {};

      const rows = tableInteractiveBody().findAllByRole("row");

      // There should be one row in the table
      rows.should("have.length", 1);

      const idColumnIndex = body.data.cols.findIndex(
        (column: DatasetColumn) => column.name === "ID",
      );

      // The first row should have the same ID column value as the initial SQL parameters
      // eslint-disable-next-line no-unsafe-element-filtering
      rows
        .findAllByTestId("cell-data")
        .eq(idColumnIndex)
        .should("have.text", String(ORDERS_ID));
    });
  });
});
