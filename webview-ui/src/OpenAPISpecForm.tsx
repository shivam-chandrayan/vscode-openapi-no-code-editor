import { useDispatch, useSelector } from "react-redux";
import { setSpec } from "./features/openapi/openapiSpecSlice";
import { vscode } from "./utilities/vscode";
import type { RootState } from "./app/store";

export default function OpenAPISpecForm() {
  const dispatch = useDispatch();
  const apiSpec = useSelector((state: RootState) => state.openAPISpec.specData);

  // Generic handler
  const handleChange = (field: string, value: string, index?: number) => {
    let updatedSpec = { ...apiSpec };

    switch (field) {
      case "openapi":
        updatedSpec = { ...updatedSpec, openapi: value };
        break;
      case "title":
        updatedSpec = {
          ...updatedSpec,
          info: { ...updatedSpec.info, title: value },
        };
        break;
      case "description":
        updatedSpec = {
          ...updatedSpec,
          info: { ...updatedSpec.info, description: value },
        };
        break;
      case "version":
        updatedSpec = {
          ...updatedSpec,
          info: { ...updatedSpec.info, version: value },
        };
        break;
      case "serverUrl":
        if (index !== undefined) {
          const servers = [...updatedSpec.servers];
          servers[index] = { ...servers[index], url: value };
          updatedSpec = { ...updatedSpec, servers };
        }
        break;
      case "serverDescription":
        if (index !== undefined) {
          const servers = [...updatedSpec.servers];
          servers[index] = { ...servers[index], description: value };
          updatedSpec = { ...updatedSpec, servers };
        }
        break;
    }

    // Save in Redux
    dispatch(setSpec({ specData: updatedSpec }));

    // Send to VSCode extension
    vscode.postMessage({
      command: "saveToWorkspace",
      value: updatedSpec,
    });
  };

  return (
    <div className="w-full max-w-lg">
      <>{JSON.stringify(apiSpec)}</>
      <form className="">
        {/* openapi version */}
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="openapi"
            >
              OpenAPI Version
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="openapi"
              type="text"
              placeholder="openapi version"
              value={apiSpec.openapi}
              onChange={(e) => handleChange("openapi", e.target.value)}
            />
          </div>
        </div>

        {/* info section */}
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div className="mb-4">
            <h2 className="block text-gray-700 text-lg font-bold mb-2">Info</h2>
          </div>
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="title"
            >
              Title
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="title"
              type="text"
              placeholder="title"
              value={apiSpec.info.title}
              onChange={(e) => handleChange("title", e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="description"
            >
              Description
            </label>
            <textarea
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="description"
              placeholder="Description"
              value={apiSpec.info.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="version"
            >
              Version
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="version"
              type="text"
              placeholder="openapi version"
              value={apiSpec.info.version}
              onChange={(e) => handleChange("version", e.target.value)}
            />
          </div>
        </div>

        {/* servers section */}
        {apiSpec.servers.length > 0 ? (
          <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
            <div className="mb-4">
              <h2 className="block text-gray-700 text-lg font-bold mb-2">
                Servers
              </h2>
            </div>
            {apiSpec.servers.map((server, index) => (
              <div key={index}>
                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor={`url-${index}`}
                  >
                    URL
                  </label>
                  <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id={`url-${index}`}
                    type="text"
                    placeholder="url"
                    value={server.url}
                    onChange={(e) =>
                      handleChange("serverUrl", e.target.value, index)
                    }
                  />
                </div>
                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor={`description-${index}`}
                  >
                    Description
                  </label>
                  <textarea
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id={`description-${index}`}
                    placeholder="Description"
                    value={server.description}
                    onChange={(e) =>
                      handleChange("serverDescription", e.target.value, index)
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </form>
    </div>
  );
}
