import { useSelector } from "react-redux";
import "./App.css";
import OpenAPISpecForm from "./OpenAPISpecForm";
import type { RootState } from "../src/app/store";

function App() {
  const title = useSelector((state: RootState) => state.openAPISpec.title);
  const version = useSelector((state: RootState) => state.openAPISpec.version);
  const description = useSelector(
    (state: RootState) => state.openAPISpec.description
  );

  return (
    <>
      <div>{title}</div>
      <div>{version}</div>
      <div>{description}</div>
      <OpenAPISpecForm />
    </>
  );
}

export default App;
