import { useContext } from "react";
import { managerContext } from "./internal";

export const useManager = () => {
  const manager = useContext(managerContext);
  if (!manager) {
    throw new Error("No Logic Provider found");
  }
  return manager;
};
