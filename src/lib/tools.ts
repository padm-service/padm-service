//使AI会调API
import { HTTPException } from "hono/http-exception";
import type { ToolDefinition } from "node_modules/@langchain/core/dist/language_models/base";
import { OpenAPIObject, OperationObject, RequestBodyObject } from "openapi3-ts/oas31";

const allow_methods = ["get", "post", "delete", "put", "patch"];
export function toOpenaiTools(
    service: string,
    schema?: OpenAPIObject
): ToolDefinition[] {
    if (!schema) return [];
    const tools: ToolDefinition[] = [];
    Object.entries(schema.paths ?? {}).forEach(function ([path, path_object]) {
        Object.entries(path_object).forEach(function ([method, operation]) {
            if (allow_methods.includes(method)) {
                const op = operation as OperationObject;
                if (!op.operationId) {
                    throw new HTTPException(400, {
                        message: `Service schema missing operationId in path ${path}`
                    });
                }
                if (!op.requestBody) {
                    return
                }
                const content = (op.requestBody as RequestBodyObject).content;
                if (!("application/json" in content)) {
                    return
                }
                var schemaRes = content["application/json"].schema as Record<string, unknown>;
                if ("$ref" in schemaRes && schema?.components?.schemas) {
                    const varity = (schemaRes["$ref"] as string).split('/').pop() as string;
                    schemaRes = schema?.components?.schemas[varity] as Record<string, unknown>;
                }
                tools.push({
                    type: "function",
                    function: {
                        name: `${service}::${path}`,
                        description: op.description,
                        parameters: schemaRes
                    }
                });
            }
        });
    });
    return tools;
}