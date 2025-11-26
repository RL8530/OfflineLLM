import { useState, useEffect, useRef } from "react";
import { BaseViewModel } from "./BaseViewModel";

export const useViewModel = <T extends BaseViewModel>(viewModel: T): T => {
  const [_, setTick] = useState(0);
  useEffect(() => {
    viewModel.renderCallback = () => setTick((prev) => prev + 1);
    viewModel.onMount();

    return () => {
      viewModel.renderCallback = undefined;
      viewModel.onUnmount();
    };
  }, [viewModel.id]);

  return viewModel;
};
