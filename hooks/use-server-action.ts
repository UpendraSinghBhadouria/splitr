"use client";

import { useCallback, useEffect, useState } from "react";

type Method = "GET" | "POST" | "PUT" | "DELETE";

interface UseServerActionOptions<Params> {
  method?: Method;
  params?: Params;
  auto?: boolean;
}

export const useServerAction = <Result, Params = void>(
  serverFunc: (params: Params) => Promise<Result>,
  options?: UseServerActionOptions<Params>
) => {
  const { method = "GET", params, auto = method === "GET" } = options || {};

  const [data, setData] = useState<Result | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(false);

  const run = useCallback(
    async (overrideParams?: Params) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await serverFunc((overrideParams ?? params) as Params);
        setData(result);
        return result;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [serverFunc, params]
  );

  // semantic wrappers
  const fetch = method === "GET" ? run : undefined;
  const create = method === "POST" ? run : undefined;
  const update = method === "PUT" ? run : undefined;
  const remove = method === "DELETE" ? run : undefined;

  useEffect(() => {
    if (auto && method === "GET") {
      run();
    }
  }, [auto, method, run]);

  return {
    data,
    error,
    isLoading,
    fetch,
    create,
    update,
    remove,
  };
};
