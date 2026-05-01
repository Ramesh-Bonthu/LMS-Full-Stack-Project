import { DependencyList, useCallback, useEffect, useState } from "react";

export interface UseApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useApi<T>(
  apiCall: () => Promise<{ success: boolean; data?: T; error?: string }>,
  dependencies: DependencyList = [],
): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiCall();
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.error || "Failed to fetch data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [apiCall]);

  useEffect(() => {
    void fetchData();
  }, [fetchData, ...dependencies]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}

export function useMutation<T = unknown, TArgs extends unknown[] = unknown[]>(
  apiCall: (...args: TArgs) => Promise<{ success: boolean; data?: T; error?: string }>,
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const mutate = async (...args: TArgs): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);
    try {
      const response = await apiCall(...args);
      if (response.success) {
        setIsSuccess(true);
        return response.data;
      } else {
        setError(response.error || "Operation failed");
        return null;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An error occurred";
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    mutate,
    isLoading,
    error,
    isSuccess,
    reset: () => {
      setError(null);
      setIsSuccess(false);
    },
  };
}
