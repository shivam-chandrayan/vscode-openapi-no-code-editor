import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { setSpec } from "./features/openapi/openapiSpecSlice";
import { vscode } from "./utilities/vscode";

export default function OpenAPISpecForm() {
  const dispatch = useDispatch();

  const [title, setTitle] = useState("");
  const [version, setVersion] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const specData = { title, version, description };

    // Save in Redux
    dispatch(setSpec(specData));

    // Send to VSCode extension (optional, for persistence)
    vscode.postMessage({
      command: "saveToWorkspace",
      value: specData,
    });
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <h2 className="text-xl font-bold mb-4">OpenAPI Spec Info</h2>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white p-4 rounded-lg shadow"
      >
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
            placeholder="My API"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Version</label>
          <input
            type="text"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
            placeholder="1.0.0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
            placeholder="Short description of the API..."
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white rounded-md py-2 hover:bg-blue-700 transition"
        >
          Save Spec
        </button>
      </form>
    </div>
  );
}
