import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ConnectionTest() {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'success' | 'error'>('testing');
  const [errorMessage, setErrorMessage] = useState('');
  const [testResults, setTestResults] = useState<any[]>([]);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setConnectionStatus('testing');
      setTestResults([]);

      // 测试1：检查环境变量
      const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('环境变量未配置，请检查 .env.local 文件');
      }

      setTestResults(prev => [...prev, {
        test: '环境变量检查',
        status: 'success',
        message: '环境变量已配置'
      }]);

      // 测试2：测试用户表
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(1);

      if (usersError) {
        throw new Error(`用户表查询失败: ${usersError.message}`);
      }

      setTestResults(prev => [...prev, {
        test: '用户表连接',
        status: 'success',
        message: '用户表连接成功'
      }]);

      // 测试3：测试地点表
      const { data: locations, error: locationsError } = await supabase
        .from('locations')
        .select('*')
        .limit(1);

      if (locationsError) {
        throw new Error(`地点表查询失败: ${locationsError.message}`);
      }

      setTestResults(prev => [...prev, {
        test: '地点表连接',
        status: 'success',
        message: '地点表连接成功'
      }]);

      // 测试4：测试物品表
      const { data: items, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .limit(1);

      if (itemsError) {
        throw new Error(`物品表查询失败: ${itemsError.message}`);
      }

      setTestResults(prev => [...prev, {
        test: '物品表连接',
        status: 'success',
        message: '物品表连接成功'
      }]);

      // 测试5：测试使用历史表
      const { data: history, error: historyError } = await supabase
        .from('item_usage_history')
        .select('*')
        .limit(1);

      if (historyError) {
        throw new Error(`使用历史表查询失败: ${historyError.message}`);
      }

      setTestResults(prev => [...prev, {
        test: '使用历史表连接',
        status: 'success',
        message: '使用历史表连接成功'
      }]);

      setConnectionStatus('success');

    } catch (error: any) {
      setConnectionStatus('error');
      setErrorMessage(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🔗 Supabase连接测试
          </h1>

          <div className="space-y-4">
            {/* 连接状态 */}
            <div className="flex items-center space-x-3">
              {connectionStatus === 'testing' && (
                <>
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-blue-600">正在测试连接...</span>
                </>
              )}
              {connectionStatus === 'success' && (
                <>
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <i className="ri-check-line text-white text-sm"></i>
                  </div>
                  <span className="text-green-600 font-medium">连接测试成功！</span>
                </>
              )}
              {connectionStatus === 'error' && (
                <>
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <i className="ri-close-line text-white text-sm"></i>
                  </div>
                  <span className="text-red-600 font-medium">连接测试失败</span>
                </>
              )}
            </div>

            {/* 错误信息 */}
            {connectionStatus === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <i className="ri-error-warning-line text-red-500 mt-0.5 mr-2"></i>
                  <div>
                    <h3 className="text-red-800 font-medium">错误信息</h3>
                    <p className="text-red-700 mt-1">{errorMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 测试结果 */}
            {testResults.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-gray-900 font-medium">测试结果</h3>
                {testResults.map((result, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    {result.status === 'success' ? (
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <i className="ri-check-line text-white text-xs"></i>
                      </div>
                    ) : (
                      <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <i className="ri-close-line text-white text-xs"></i>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-gray-900">{result.test}</span>
                      <p className="text-sm text-gray-600">{result.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={testConnection}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                重新测试
              </button>
              {connectionStatus === 'success' && (
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  进入系统
                </button>
              )}
            </div>

            {/* 配置说明 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <i className="ri-information-line text-blue-500 mt-0.5 mr-2"></i>
                <div>
                  <h3 className="text-blue-800 font-medium">配置说明</h3>
                  <div className="text-blue-700 text-sm mt-1">
                    <p>1. 确保已创建 .env.local 文件</p>
                    <p>2. 配置正确的 Supabase URL 和密钥</p>
                    <p>3. 确认数据库表已创建</p>
                    <p>4. 检查网络连接</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
