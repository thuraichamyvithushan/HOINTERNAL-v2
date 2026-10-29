import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DynamicDashboardGrid from "./DynamicDashboardGrid";
import useDashboardConfig from "../utils/useDashboardConfig";

jest.mock("../utils/useDashboardConfig", () => ({ __esModule: true, default: jest.fn() }));

const emptySections = [
  { id: "marketing", title: "Marketing", tiles: [] },
  { id: "developers", title: "Developers", tiles: [] },
];

beforeEach(() => {
  useDashboardConfig.mockReturnValue({ sections: emptySections, loading: false });
});

const renderGrid = (props = {}) => render(
  <MemoryRouter>
    <DynamicDashboardGrid pageId="works-in-progress-au" {...props} />
  </MemoryRouter>
);

test("keeps both work sections visible before tiles are added", () => {
  renderGrid({ showEmptySections: true });
  expect(screen.getByRole("heading", { name: "Marketing" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Developers" })).toBeInTheDocument();
  expect(screen.getAllByText("No tiles added yet.")).toHaveLength(2);
  expect(screen.queryByText("No tiles found.")).not.toBeInTheDocument();
});

test("continues hiding empty sections on existing dashboards", () => {
  renderGrid();
  expect(screen.queryByRole("heading", { name: "Marketing" })).not.toBeInTheDocument();
  expect(screen.getByText("No tiles found.")).toBeInTheDocument();
});

test("searches tiles across both work sections and restores them when cleared", () => {
  useDashboardConfig.mockReturnValue({
    loading: false,
    sections: [
      { id: "marketing", title: "Marketing", tiles: [{ id: "campaign", title: "Launch campaign", linkType: "none" }] },
      { id: "developers", title: "Developers", tiles: [{ id: "portal", title: "Portal update", linkType: "none" }] },
    ],
  });
  renderGrid({ showEmptySections: true });
  const search = screen.getByRole("textbox", { name: "Search dashboard" });
  fireEvent.change(search, { target: { value: "PORTAL" } });
  expect(screen.getByText("Portal update")).toBeInTheDocument();
  expect(screen.queryByText("Launch campaign")).not.toBeInTheDocument();
  fireEvent.change(search, { target: { value: "no match" } });
  expect(screen.getByText("No tiles found.")).toBeInTheDocument();
  fireEvent.change(search, { target: { value: "" } });
  expect(screen.getByText("Launch campaign")).toBeInTheDocument();
  expect(screen.getByText("Portal update")).toBeInTheDocument();
});
