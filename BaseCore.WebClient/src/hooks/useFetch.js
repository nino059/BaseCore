import { useState, useEffect, useCallback } from 'react';

/**
 * Hook gọi API dùng chung: gom {data, loading, error} + refetch.
 * Thay cho pattern useState(loading/error) + useEffect lặp lại ở nhiều trang.
 *
 * @param {() => Promise<any>} fetcher  hàm trả về Promise (thường là lời gọi axios)
 * @param {Array}              deps     dependency list — fetch lại khi đổi
 * @param {object}             options  { initialData, select, enabled }
 *   - select(res): trích dữ liệu từ response (mặc định res?.data)
 *   - enabled: false để hoãn fetch (mặc định true)
 * @returns {{ data, loading, error, refetch, setData }}
 */
export function useFetch(fetcher, deps = [], options = {}) {
  const { initialData = null, select, enabled = true } = options;
  const [data, setData]       = useState(initialData);
  const [loading, setLoading] = useState(enabled);
  const [error, setError]     = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher();
      setData(select ? select(res) : res?.data);
    } catch (e) {
      console.error(e);
      setError(e);
    } finally {
      setLoading(false);
    }
    // fetcher/select do nơi gọi kiểm soát qua `deps` (cố ý không đưa vào dependency list)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (enabled) refetch();
  }, [enabled, refetch]);

  return { data, loading, error, refetch, setData };
}

export default useFetch;
