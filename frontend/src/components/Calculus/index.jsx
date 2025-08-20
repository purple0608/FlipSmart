import { useEffect, useState } from "react";
import Dashboard from "./dashboard";
import Walkthrough from "./walkthrough";

export default function Calculus() {
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("walkthrough") ) {
      setRun(false);
    } else {
      setRun(true);
    }
  }, [run]);
  return (
    <Walkthrough run={run}>
      <Dashboard />
    </Walkthrough>
  );
}