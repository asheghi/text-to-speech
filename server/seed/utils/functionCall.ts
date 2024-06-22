/* eslint-disable @typescript-eslint/no-explicit-any */
import ollama from 'ollama';
import type z from 'zod'
import { db } from '@/db';
import hash from 'object-hash'


type ArgType = {
    schema: Record<string, any>,
    schemaValidator: z.ZodObject<any>,
    model: string,
    systemPrompt: string,
    label: string;
    useCache: boolean
}


export const createFunctionCall = ({ schema, model, label, schemaValidator, systemPrompt, useCache }: ArgType) => {
    return (...userArgs: string[]) => {
        async function runFunctionOllama(...userArgs: string[]): Promise<string> {
            console.log("[fc] calling ollama for ", label, userArgs)

            const response = await ollama.chat({
                model: model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...userArgs.map(input => ({ role: 'user', content: input }))
                ],
                options: {
                    temperature: 0.0,
                }
            })

            const content = response.message.content;

            return content;
        }

        async function runFunction(...userArgs: string[]) {
            console.log('[fc] ', label, ' called with', userArgs);

            const key = getCacheKey(...userArgs);
            let value: string | undefined = undefined;
            if (useCache) {
                const entry = await db.ollamaCache.findUnique({ where: { key } });
                if (entry) {
                    value = entry.value;
                }
            }

            if (!value) {
                value = await runFunctionOllama(...userArgs);
                await updateCache(key, value);
            }

            if (!value) throw new Error(`Failed to get capital from ollama`);

            let parsed, validated
            try {
                parsed = JSON.parse(value)
                validated = schemaValidator.parse(parsed)
                return validated;
            } catch (error) {
                console.log({ value, parsed, validated, error });
                throw new Error('failed to parse response');
            }
        }

        function getCacheKey(...userArgs: string[]) {
            return `${label}_${userArgs.join('_')}_${hash({ systemPrompt, model, schema })}`;
        }

        async function updateCache(key: string, value: string) {
            if (!value) return;
            return db.ollamaCache.upsert({
                create: {
                    key,
                    value,
                },
                update: { value, key },
                where: { key },
            });
        }

        return runFunction(...userArgs);

    }

}