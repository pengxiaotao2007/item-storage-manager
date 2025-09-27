
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import PWAInstallPrompt from '../../components/PWAInstallPrompt';

interface Item {
  id: string;
  itemCode: string;
  itemName: string;
  location: string;
  placedAt: string;
  recordedAt: string;
  createdBy: string;
  createdByPhone: string;
  // 新增字段
  lastUpdatedBy: string;
  lastUpdatedByPhone: string;
  lastUpdatedAt: string;
  usageHistory: ItemUsage[];
}

interface ItemUsage {
  id: string;
  location: string;
  updatedBy: string;
  updatedByPhone: string;
  updatedAt: string;
  action: 'created' | 'moved' | 'used';
}

interface Location {
  id: string;
  name: string;
  description?: string;
}

interface User {
  id: string;
  username: string;
  phoneNumber: string;
  loginTime: string;
}

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(true);
  const [loginStep, setLoginStep] = useState<'phone' | 'verify'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [showLocationManager, setShowLocationManager] = useState(false);
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  // 新增状态
  const [showUpdateLocationForm, setShowUpdateLocationForm] = useState(false);
  const [itemToUpdate, setItemToUpdate] = useState<Item | null>(null);
  const [newLocationForUpdate, setNewLocationForUpdate] = useState('');
  const [showUsageHistory, setShowUsageHistory] = useState(false);
  const [selectedItemForHistory, setSelectedItemForHistory] = useState<Item | null>(null);
  
  // 添加缺失的状态变量
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchPage, setShowSearchPage] = useState(false);
  const [searchCode, setSearchCode] = useState('');
  const [searchResults, setSearchResults] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
  const [lastUsedLocation, setLastUsedLocation] = useState('');
  
  const [newItem, setNewItem] = useState({
    itemCode: '',
    itemName: '',
    location: '',
    placedAt: ''
  });
  const [newLocation, setNewLocation] = useState({
    name: '',
    description: ''
  });

  // 添加日期选择相关状态
  const [dateYear, setDateYear] = useState('');
  const [dateMonth, setDateMonth] = useState('');
  const [dateDay, setDateDay] = useState('');

  // 新增编辑地点状态
  const [showEditLocation, setShowEditLocation] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [editLocationData, setEditLocationData] = useState({
    name: '',
    description: ''
  });

  // 新增：显示物品代码+日期二维码生成器的状态
  const [showQRWithDateGenerator, setShowQRWithDateGenerator] = useState(false);
  const [qrWithDateData, setQrWithDateData] = useState({
    itemCode: '',
    placedAt: '',
    generatedQRData: ''
  });

  // 添加缺失的函数
  const handleShowAddForm = () => {
    setNewItem({ 
      itemCode: '', 
      itemName: '', 
      location: lastUsedLocation, 
      placedAt: new Date().toISOString().split('T')[0] 
    });
    const today = new Date();
    setDateYear(today.getFullYear().toString());
    setDateMonth(String(today.getMonth() + 1).padStart(2, '0'));
    setDateDay(String(today.getDate()).padStart(2, '0'));
    setShowAddForm(true);
  };

  const handleSearch = async () => {
    if (!searchCode.trim()) {
      showAlertMessage('请输入要查找的物品代码');
      return;
    }

    setIsLoading(true);
    try {
      let query = supabase
        .from('items')
        .select('*');

      if (searchCode.includes('_')) {
        // 精确匹配模式：物品代码_日期
        const parts = searchCode.split('_');
        if (parts.length === 2) {
          const [itemCode, placedAt] = parts;
          query = query
            .eq('item_code', itemCode)
            .eq('placed_at', placedAt);
        }
      } else {
        // 模糊匹配模式：只匹配物品代码
        query = query.eq('item_code', searchCode);
      }

      const { data, error } = await query.order('recorded_at', { ascending: false });

      if (error) {
        console.error('搜索失败:', error);
        showAlertMessage('搜索失败，请重试');
        setSearchResults([]);
        return;
      }

      const mappedResults = (data || []).map(item => ({
        id: item.id,
        itemCode: item.item_code,
        itemName: item.item_name,
        location: item.location_name,
        placedAt: item.placed_at,
        recordedAt: item.recorded_at,
        createdBy: item.created_by_name,
        createdByPhone: item.created_by_phone,
        lastUpdatedBy: item.last_updated_by || item.created_by_name,
        lastUpdatedByPhone: item.last_updated_by_phone || item.created_by_phone,
        lastUpdatedAt: item.last_updated_at || item.recorded_at,
        usageHistory: []
      }));

      setSearchResults(mappedResults);
    } catch (error) {
      console.error('搜索异常:', error);
      showAlertMessage('搜索异常，请重试');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanQRForSearch = () => {
    const mockQRCodesWithDate = [
      'BOOK001_2024-01-15',
      'KEY001_2023-12-20',
      'MED001_2024-01-10',
      'TOOL001_2023-11-25',
      'ELEC001_2024-01-08'
    ];
    const randomCode = mockQRCodesWithDate[Math.floor(Math.random() * mockQRCodesWithDate.length)];
    setSearchCode(randomCode);
  };

  const handleGenerateQR = (item: Item) => {
    setSelectedItem(item);
    setShowQRGenerator(true);
  };

  const handleAddLocation = async () => {
    if (!newLocation.name.trim()) {
      showAlertMessage('地点名称不能为空');
      return;
    }

    if (!currentUser) {
      showAlertMessage('用户信息异常，请重新登录');
      return;
    }

    // 检查地点名称是否已存在
    const existingLocation = locations.find(loc => loc.name.toLowerCase() === newLocation.name.toLowerCase());
    if (existingLocation) {
      showAlertMessage('该地点名称已存在，请使用其他名称');
      return;
    }

    setIsLoading(true);

    const location: Location = {
      id: generateUUID(),
      name: newLocation.name,
      description: newLocation.description
    };

    const result = await saveLocation(location, currentUser.id);
    if (result.success) {
      const updatedLocations = [...locations, location];
      setLocations(updatedLocations);
      setNewLocation({ name: '', description: '' });
      setShowLocationForm(false);
      showAlertMessage('地点添加成功');
    } else {
      showAlertMessage('地点添加失败，请重试');
    }

    setIsLoading(false);
  };

  // 添加日期生成函数
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= currentYear - 10; year--) {
      years.push(year.toString());
    }
    return years;
  };

  const generateMonthOptions = () => {
    const months = [];
    for (let month = 1; month <= 12; month++) {
      months.push({
        value: String(month).padStart(2, '0'),
        label: `${month}月`
      });
    }
    return months;
  };

  const generateDayOptions = () => {
    if (!dateYear || !dateMonth) return [];
    
    const year = parseInt(dateYear);
    const month = parseInt(dateMonth);
    const daysInMonth = new Date(year, month, 0).getDate();
    
    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        value: String(day).padStart(2, '0'),
        label: `${day}日`
      });
    }
    return days;
  };

  const handleYearMonthChange = (year: string, month: string) => {
    setDateYear(year);
    setDateMonth(month);
    
    // 如果当前选择的日期在新的年月中不存在，则重置日期
    if (year && month && dateDay) {
      const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
      if (parseInt(dateDay) > daysInMonth) {
        setDateDay('');
      }
    }
    
    // 自动设置 placedAt
    if (year && month && dateDay) {
      const formattedDate = `${year}-${month}-${dateDay}`;
      setNewItem({ ...newItem, placedAt: formattedDate });
    }
  };

  // 监听日期变化，自动更新 placedAt
  useEffect(() => {
    if (dateYear && dateMonth && dateDay) {
      const formattedDate = `${dateYear}-${dateMonth}-${dateDay}`;
      setNewItem({ ...newItem, placedAt: formattedDate });
    }
  }, [dateYear, dateMonth, dateDay]);

  // 设置Supabase会话变量
  const setSupabaseSession = async (phoneNumber: string) => {
    try {
      const { error } = await supabase.rpc('set_config', {
        setting_name: 'app.current_user_phone',
        setting_value: phoneNumber,
        is_local: true
      });
      
      if (error) {
        console.error('设置会话变量失败:', error);
      }
    } catch (error) {
      console.error('设置会话变量异常:', error);
    }
  };

  // 检查登录状态
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        
        // 检查用户ID是否为有效的UUID格式
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        
        if (!uuidRegex.test(user.id)) {
          // 如果不是有效UUID，清除localStorage并重新登录
          console.log('检测到无效的用户ID格式，清除本地数据');
          localStorage.removeItem('currentUser');
          setShowLogin(true);
          return;
        }
        
        setCurrentUser(user);
        setShowLogin(false);
        // 获取数据库数据
        loadUserData(user.id);
      } catch (error) {
        console.error('解析用户数据失败:', error);
        localStorage.removeItem('currentUser');
        setShowLogin(true);
      }
    }
  }, []);

  // 从数据库加载用户数据
  const loadUserData = async (userId: string) => {
    setIsLoading(true);
    try {
      // 设置会话变量
      if (currentUser) {
        await setSupabaseSession(currentUser.phoneNumber);
      }

      // 加载地点数据
      const locationsResult = await loadLocations(userId);
      if (locationsResult.success) {
        setLocations(locationsResult.data);
      }

      // 加载物品数据 - 现在加载所有物品
      const itemsResult = await loadItems();
      if (itemsResult.success) {
        setItems(itemsResult.data);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      showAlertMessage('加载数据失败，请刷新页面重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 从数据库加载地点
  const loadLocations = async (userId: string) => {
    try {
      // 确保设置会话变量
      if (currentUser) {
        await setSupabaseSession(currentUser.phoneNumber);
      }

      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('加载地点失败:', error);
        return { success: false, data: [] };
      }

      const mappedLocations = data.map(loc => ({
        id: loc.id,
        name: loc.name,
        description: loc.description
      }));

      return { success: true, data: mappedLocations };
    } catch (error) {
      console.error('加载地点异常:', error);
      return { success: false, data: [] };
    }
  };

  // 从数据库加载物品 - 修改为包含使用历史
  const loadItems = async () => {
    try {
      // 确保设置会话变量
      if (currentUser) {
        await setSupabaseSession(currentUser.phoneNumber);
      }

      // 查询所有物品记录
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .order('recorded_at', { ascending: false });

      if (itemsError) {
        console.error('加载物品失败:', itemsError);
        return { success: false, data: [] };
      }

      // 查询使用历史
      const { data: historyData, error: historyError } = await supabase
        .from('item_usage_history')
        .select('*')
        .order('updated_at', { ascending: false });

      if (historyError) {
        console.error('加载使用历史失败:', historyError);
      }

      // 组合数据
      const mappedItems = itemsData.map(item => {
        const itemHistory = (historyData?.filter(h => 
          h.item_code === item.item_code && h.placed_at === item.placed_at
        )) || [];

        return {
          id: item.id,
          itemCode: item.item_code,
          itemName: item.item_name,
          location: item.location_name,
          placedAt: item.placed_at,
          recordedAt: item.recorded_at,
          createdBy: item.created_by_name,
          createdByPhone: item.created_by_phone,
          lastUpdatedBy: item.last_updated_by || item.created_by_name,
          lastUpdatedByPhone: item.last_updated_by_phone || item.created_by_phone,
          lastUpdatedAt: item.last_updated_at || item.recorded_at,
          usageHistory: itemHistory.map(h => ({
            id: h.id,
            location: h.location_name,
            updatedBy: h.updated_by_name,
            updatedByPhone: h.updated_by_phone,
            updatedAt: h.updated_at,
            action: h.action
          }))
        };
      });

      return { success: true, data: mappedItems };
    } catch (error) {
      console.error('加载物品异常:', error);
      return { success: false, data: [] };
    }
  };

  // 更新物品位置
  const updateItemLocation = async (item: Item, newLocation: string) => {
    try {
      if (!currentUser) {
        showAlertMessage('用户信息异常，请重新登录');
        return false;
      }

      // 确保设置会话变量
      await setSupabaseSession(currentUser.phoneNumber);

      const now = new Date();
      const updateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      // 更新物品表
      const { error: updateError } = await supabase
        .from('items')
        .update({
          location_name: newLocation,
          last_updated_by: currentUser.username,
          last_updated_by_phone: currentUser.phoneNumber,
          last_updated_at: updateTime
        })
        .eq('item_code', item.itemCode)
        .eq('placed_at', item.placedAt);

      if (updateError) {
        console.error('更新物品位置失败:', updateError);
        return false;
      }

      // 添加使用历史记录
      const { error: historyError } = await supabase
        .from('item_usage_history')
        .insert({
          id: generateUUID(),
          item_code: item.itemCode,
          placed_at: item.placedAt,
          location_name: newLocation,
          updated_by_name: currentUser.username,
          updated_by_phone: currentUser.phoneNumber,
          updated_at: updateTime,
          action: item.location === newLocation ? 'used' : 'moved',
          previous_location: item.location
        });

      if (historyError) {
        console.error('添加使用历史失败:', historyError);
        // 不阻断主流程，只记录错误
      }

      return true;
    } catch (error) {
      console.error('更新物品位置异常:', error);
      return false;
    }
  };

  // 检查物品是否已存在（基于物品代码+创建日期）
  const checkItemExists = async (itemCode: string, placedAt: string) => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('item_code', itemCode)
        .eq('placed_at', placedAt);

      if (error) {
        console.error('检查物品是否存在失败:', error);
        return { exists: false, item: null };
      }

      if (data && data.length > 0) {
        return { 
          exists: true, 
          item: {
            id: data[0].id,
            itemCode: data[0].item_code,
            itemName: data[0].item_name,
            location: data[0].location_name,
            placedAt: data[0].placed_at,
            recordedAt: data[0].recorded_at,
            createdBy: data[0].created_by_name,
            createdByPhone: data[0].created_by_phone,
            lastUpdatedBy: data[0].last_updated_by || data[0].created_by_name,
            lastUpdatedByPhone: data[0].last_updated_by_phone || data[0].created_by_phone,
            lastUpdatedAt: data[0].last_updated_at || data[0].recorded_at,
            usageHistory: []
          } as Item
        };
      }

      return { exists: false, item: null };
    } catch (error) {
      console.error('检查物品是否存在异常:', error);
      return { exists: false, item: null };
    }
  };

  // 显示更新位置弹窗
  const handleShowUpdateLocation = (item: Item) => {
    setItemToUpdate(item);
    setNewLocationForUpdate(item.location);
    setShowUpdateLocationForm(true);
  };

  // 确认更新位置
  const handleConfirmUpdateLocation = async () => {
    if (!itemToUpdate || !newLocationForUpdate.trim()) {
      showAlertMessage('请选择新的存放位置');
      return;
    }

    if (!currentUser) {
      showAlertMessage('用户信息异常，请重新登录');
      return;
    }

    setIsLoading(true);

    const success = await updateItemLocation(itemToUpdate, newLocationForUpdate);
    if (success) {
      // 重新加载数据以显示最新状态
      await loadUserData(currentUser.id);
      setShowUpdateLocationForm(false);
      setItemToUpdate(null);
      setNewLocationForUpdate('');
      showAlertMessage(`物品位置已更新为"${newLocationForUpdate}"`);
    } else {
      showAlertMessage('更新位置失败，请重试');
    }

    setIsLoading(false);
  };

  // 显示使用历史
  const handleShowUsageHistory = (item: Item) => {
    setSelectedItemForHistory(item);
    setShowUsageHistory(true);
  };

  // 保存用户到数据库
  const saveUser = async (user: User) => {
    try {
      // 设置会话变量
      await setSupabaseSession(user.phoneNumber);

      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          username: user.username, // 修正字段名
          phone_number: user.phoneNumber,
          login_time: user.loginTime,
        });

      if (error) {
        console.error('保存用户失败:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('保存用户异常:', error);
      return false;
    }
  };

  // 保存地点到数据库
  const saveLocation = async (location: Location, userId: string) => {
    try {
      // 确保设置会话变量
      if (currentUser) {
        await setSupabaseSession(currentUser.phoneNumber);
      }

      const { data, error } = await supabase
        .from('locations')
        .insert({
          id: location.id,
          name: location.name,
          description: location.description,
          created_by: userId
        })
        .select()
        .single();

      if (error) {
        console.error('保存地点失败:', error);
        return { success: false, data: null };
      }

      return { success: true, data };
    } catch (error) {
      console.error('保存地点异常:', error);
      return { success: false, data: null };
    }
  };

  // 保存物品到数据库 - 修改以支持新字段
  const saveItem = async (item: Item, userId: string) => {
    try {
      // 确保设置会话变量
      if (currentUser) {
        await setSupabaseSession(currentUser.phoneNumber);
      }

      const { data, error } = await supabase
        .from('items')
        .insert({
          id: item.id,
          item_code: item.itemCode,
          item_name: item.itemName,
          location_name: item.location,
          placed_at: item.placedAt,
          recorded_at: item.recordedAt,
          created_by_name: item.createdBy,
          created_by_phone: item.createdByPhone,
          last_updated_by: item.lastUpdatedBy,
          last_updated_by_phone: item.lastUpdatedByPhone,
          last_updated_at: item.lastUpdatedAt,
          user_id: userId
        })
        .select()
        .single();

      if (error) {
        console.error('保存物品失败:', error);
        return { success: false, data: null };
      }

      return { success: true, data };
    } catch (error) {
      console.error('保存物品异常:', error);
      return { success: false, data: null };
    }
  };

  // 从数据库删除地点
  const deleteLocation = async (locationId: string) => {
    try {
      // 确保设置会话变量
      if (currentUser) {
        await setSupabaseSession(currentUser.phoneNumber);
      }

      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', locationId);

      if (error) {
        console.error('删除地点失败:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('删除地点异常:', error);
      return false;
    }
  };

  // 确认删除地点
  const handleConfirmDelete = async () => {
    if (!locationToDelete) {
      showAlertMessage('删除数据异常，请重试');
      return;
    }

    setIsLoading(true);

    const success = await deleteLocation(locationToDelete.id);
    if (success) {
      // 更新本地状态
      const updatedLocations = locations.filter(loc => loc.id !== locationToDelete.id);
      setLocations(updatedLocations);

      setShowDeleteConfirm(false);
      setLocationToDelete(null);
      showAlertMessage('地点删除成功');
    } else {
      showAlertMessage('地点删除失败，请重试');
    }

    setIsLoading(false);
  };

  // 取消删除地点
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setLocationToDelete(null);
  };

  // 显示删除确认弹窗
  const handleShowDeleteLocation = (location: Location) => {
    setLocationToDelete(location);
    setShowDeleteConfirm(true);
  };

  // 更新地点到数据库
  const updateLocation = async (locationId: string, updatedData: { name: string; description?: string }) => {
    try {
      // 确保设置会话变量
      if (currentUser) {
        await setSupabaseSession(currentUser.phoneNumber);
      }

      const { error } = await supabase
        .from('locations')
        .update({
          name: updatedData.name,
          description: updatedData.description
        })
        .eq('id', locationId);

      if (error) {
        console.error('更新地点失败:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('更新地点异常:', error);
      return false;
    }
  };

  // 显示编辑地点弹窗
  const handleShowEditLocation = (location: Location) => {
    setEditingLocation(location);
    setEditLocationData({
      name: location.name,
      description: location.description || ''
    });
    setShowEditLocation(true);
  };

  // 保存地点编辑
  const handleSaveEditLocation = async () => {
    if (!editLocationData.name.trim()) {
      showAlertMessage('地点名称不能为空');
      return;
    }

    if (!editingLocation) {
      showAlertMessage('编辑数据异常，请重试');
      return;
    }

    setIsLoading(true);

    const success = await updateLocation(editingLocation.id, editLocationData);
    if (success) {
      // 更新本地状态
      const updatedLocations = locations.map(loc => 
        loc.id === editingLocation.id 
          ? { ...loc, name: editLocationData.name, description: editLocationData.description }
          : loc
      );
      setLocations(updatedLocations);

      // 如果地点名称发生改变，需要更新所有使用此地点的物品记录
      if (editingLocation.name !== editLocationData.name) {
        const updatedItems = items.map(item => 
          item.location === editingLocation.name 
            ? { ...item, location: editLocationData.name }
            : item
        );
        setItems(updatedItems);

        // 更新数据库中的物品记录
        try {
          await supabase
            .from('items')
            .update({ location_name: editLocationData.name })
            .eq('location_name', editingLocation.name);
        } catch (error) {
          console.error('更新物品地点名称失败:', error);
        }
      }

      setShowEditLocation(false);
      setEditingLocation(null);
      setEditLocationData({ name: '', description: '' });
      showAlertMessage('地点修改成功');
    } else {
      showAlertMessage('地点修改失败，请重试');
    }

    setIsLoading(false);
  };

  // 取消编辑地点
  const handleCancelEditLocation = () => {
    setShowEditLocation(false);
    setEditingLocation(null);
    setEditLocationData({ name: '', description: '' });
  };

  // 显示提示信息
  const showAlertMessage = (message: string) => {
    setAlertMessage(message);
    setShowAlert(true);
  };

  // 倒计时效果
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 验证手机号格式
  const isValidPhoneNumber = (phone: string) => {
    const phonePattern = /^1[3-9]\d{9}$/;
    return phonePattern.test(phone);
  };

  // 发送验证码
  const handleSendCode = () => {
    if (!phoneNumber.trim()) {
      showAlertMessage('请输入手机号码');
      return;
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      showAlertMessage('请输入正确的手机号码格式');
      return;
    }

    // 模拟发送验证码
    setCountdown(60);
    setLoginStep('verify');
    showAlertMessage('验证码已发送到您的手机，请查收微信短信');
  };

  // 重新发送验证码
  const handleResendCode = () => {
    if (countdown > 0) return;
    setCountdown(60);
    showAlertMessage('验证码已重新发送');
  };

  // 生成标准UUID v4的辅助函数
  const generateUUID = () => {
    return crypto.randomUUID();
  };

  // 生成基于手机号的固定UUID
  const generateUserUUID = (phoneNumber: string) => {
    // 使用手机号生成固定的UUID，确保同一手机号总是生成相同的UUID
    const encoder = new TextEncoder();
    const data = encoder.encode(`user_${phoneNumber}`);
    
    // 使用更好的哈希算法生成固定的UUID
    let hash1 = 0;
    let hash2 = 0;
    for (let i = 0; i < data.length; i++) {
      hash1 = ((hash1 << 5) - hash1 + data[i]) & 0xffffffff;
      hash2 = ((hash2 << 3) - hash2 + data[i] * 7) & 0xffffffff;
    }
    
    // 将hash转换为标准UUID v4格式
    const hex1 = Math.abs(hash1).toString(16).padStart(8, '0');
    const hex2 = Math.abs(hash2).toString(16).padStart(8, '0');
    
    // 生成符合 UUID v4 标准的格式: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuid = [
      hex1.slice(0, 8),
      hex1.slice(0, 4),
      '4' + hex2.slice(0, 3),
      '8' + hex1.slice(4, 7),
      (hex2.slice(4, 8) + hex1.slice(4, 8) + phoneNumber.slice(-4)).slice(0, 12)
    ].join('-');
    
    return uuid;
  };

  // 验证登录
  const handleLogin = async () => {
    if (!verificationCode.trim()) {
      showAlertMessage('请输入验证码');
      return;
    }

    if (verificationCode.length !== 6) {
      showAlertMessage('请输入6位验证码');
      return;
    }

    setIsLoading(true);

    // 验证码验证 - 支持特定手机号直接登录
    const isValidCode = verificationCode === '123456' || phoneNumber === '18938380887';
    
    if (isValidCode) {
      const now = new Date();
      const loginTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      // 模拟获取微信用户名
      const mockWechatNames = ['微信用户001', '阳光小镇', '梦想追逐者', '快乐每一天', '星空漫步者'];
      const randomWechatName = mockWechatNames[Math.floor(Math.random() * mockWechatNames.length)];

      // 使用基于手机号的固定UUID生成用户ID
      const userId = generateUserUUID(phoneNumber);

      const user: User = {
        id: userId,
        username: randomWechatName,
        phoneNumber: phoneNumber,
        loginTime: loginTime
      };

      // 保存用户到数据库
      const saveSuccess = await saveUser(user);
      if (saveSuccess) {
        setCurrentUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        setShowLogin(false);
        setPhoneNumber('');
        setVerificationCode('');
        setLoginStep('phone');
        
        // 加载用户数据
        await loadUserData(user.id);
        showAlertMessage('登录成功');
      } else {
        showAlertMessage('登录失败，请重试');
      }
    } else {
      showAlertMessage('验证码错误，请重新输入');
    }
    
    setIsLoading(false);
  };

  // 处理退出登录
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setShowLogin(true);
    setItems([]);
    setLocations([]);
    setSearchResults([]);
    setLoginStep('phone');
    setPhoneNumber('');
    setVerificationCode('');
    setCountdown(0);
  };

  const handleScanQR = () => {
    const mockQRCodes = ['ELEC001', 'CLOTH002', 'BOOK003', 'TOOL004', 'MED005'];
    const randomCode = mockQRCodes[Math.floor(Math.random() * mockQRCodes.length)];
    setNewItem({ ...newItem, itemCode: randomCode });
  };

  // 新增：扫描物品代码+创建时间二维码的功能
  const handleScanQRWithDate = () => {
    // 模拟扫描包含"物品代码+创建时间"的二维码
    const mockQRCodesWithDate = [
      'BOOK001_2024-01-15',
      'KEY001_2023-12-20',
      'MED001_2024-01-10',
      'TOOL001_2023-11-25',
      'ELEC001_2024-01-08',
      'CLOTH002_2023-10-15',
      'GAME001_2024-01-12',
      'KITCHEN001_2023-09-30'
    ];

    const randomQRData = mockQRCodesWithDate[Math.floor(Math.random() * mockQRCodesWithDate.length)];
    
    // 解析二维码数据
    if (randomQRData.includes('_')) {
      const parts = randomQRData.split('_');
      const itemCode = parts[0];
      const dateString = parts[1];
      
      // 自动填入物品代码
      setNewItem({ ...newItem, itemCode: itemCode });
      
      // 解析日期并自动填入日期选择器
      if (dateString) {
        const dateParts = dateString.split('-');
        if (dateParts.length === 3) {
          setDateYear(dateParts[0]);
          setDateMonth(dateParts[1]);
          setDateDay(dateParts[2]);
        }
      }
    } else {
      // 如果不包含日期信息，只填入物品代码
      setNewItem({ ...newItem, itemCode: randomQRData });
    }
  };

  // 新增：处理紫色二维码按钮点击 - 显示二维码生成界面
  const handleShowQRWithDateGenerator = () => {
    // 使用当前表单的数据或生成模拟数据
    const currentItemCode = newItem.itemCode || 'ITEM001';
    const currentPlacedAt = newItem.placedAt || new Date().toISOString().split('T')[0];
    
    setQrWithDateData({
      itemCode: currentItemCode,
      placedAt: currentPlacedAt,
      generatedQRData: `${currentItemCode}_${currentPlacedAt}`
    });
    setShowQRWithDateGenerator(true);
  };

  // 生成二维码数据
  const generateQRData = (item: Item) => {
    return `${item.itemCode}_${item.placedAt}`;
  };

  const getQRCodeUrl = (data: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
  };

  const filteredItems = items.filter(item =>
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 修改添加物品记录函数
  const handleAddItem = async () => {
    if (!newItem.itemCode.trim()) {
      showAlertMessage('物品代码不能为空');
      return;
    }

    if (!currentUser) {
      showAlertMessage('用户信息异常，请重新登录');
      return;
    }

    setIsLoading(true);

    const placedAtDate = newItem.placedAt || new Date().toISOString().split('T')[0];

    // 检查物品是否已存在
    const existsResult = await checkItemExists(newItem.itemCode, placedAtDate);
    
    if (existsResult.exists && existsResult.item) {
      // 物品已存在，询问是否要更新位置
      setIsLoading(false);
      setItemToUpdate(existsResult.item);
      setNewLocationForUpdate(newItem.location);
      setShowAddForm(false);
      
      showAlertMessage(`物品"${newItem.itemCode}"（${placedAtDate}）已存在，当前位置：${existsResult.item.location}。是否要更新到新位置？`);
      
      setTimeout(() => {
        setShowUpdateLocationForm(true);
      }, 2000);
      
      return;
    }

    // 物品不存在，创建新记录
    const now = new Date();
    const recordTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const item: Item = {
      id: generateUUID(),
      itemCode: newItem.itemCode,
      itemName: newItem.itemName,
      location: newItem.location,
      placedAt: placedAtDate,
      recordedAt: recordTime,
      createdBy: currentUser.username,
      createdByPhone: currentUser.phoneNumber,
      lastUpdatedBy: currentUser.username,
      lastUpdatedByPhone: currentUser.phoneNumber,
      lastUpdatedAt: recordTime,
      usageHistory: []
    };

    const result = await saveItem(item, currentUser.id);
    if (result.success) {
      // 添加初始使用历史记录
      try {
        await supabase
          .from('item_usage_history')
          .insert({
            id: generateUUID(),
            item_code: item.itemCode,
            placed_at: item.placedAt,
            location_name: item.location,
            updated_by_name: currentUser.username,
            updated_by_phone: currentUser.phoneNumber,
            updated_at: recordTime,
            action: 'created',
            previous_location: null
          });
      } catch (error) {
        console.error('添加初始使用历史失败:', error);
      }

      // 重新加载数据
      await loadUserData(currentUser.id);
      
      if (newItem.location) {
        setLastUsedLocation(newItem.location);
      }

      setNewItem({ itemCode: '', itemName: '', location: '', placedAt: '' });
      setShowAddForm(false);
      showAlertMessage('物品记录创建成功');
    } else {
      showAlertMessage('物品记录创建失败，请重试');
    }

    setIsLoading(false);
  };

  // 登录界面
  if (showLogin || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-archive-line text-white text-3xl"></i>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">物品存放管理</h1>
            <p className="text-gray-500">通过微信短信验证登录</p>
          </div>

          {loginStep === 'phone' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  手机号码
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                    <i className="ri-smartphone-line text-gray-400"></i>
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="请输入您的手机号码"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength={11}
                  />
                </div>
              </div>

              <button
                onClick={handleSendCode}
                className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                发送验证码
              </button>

              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-start">
                  <i className="ri-wechat-line text-green-500 mt-0.5 mr-2"></i>
                  <div className="text-xs text-green-600">
                    <p className="font-medium mb-1">微信短信验证：</p>
                    <p>• 验证码将通过微信短信发送</p>
                    <p>• 请确保手机号与微信绑定</p>
                    <p>• 登录后将自动获取微信昵称</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  验证码
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                    <i className="ri-shield-keyhole-line text-gray-400"></i>
                  </div>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="请输入6位验证码"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength={6}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">验证码已发送至：{phoneNumber}</span>
                <button
                  onClick={handleResendCode}
                  className="text-blue-500 hover:text-blue-600 font-medium"
                >
                  重新发送
                </button>
              </div>

              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? '验证中...' : '验证登录'}
              </button>

              <button
                onClick={() => {
                  setLoginStep('phone');
                  setVerificationCode('');
                  setCountdown(0);
                }}
                className="w-full py-2 text-gray-500 text-sm"
              >
                返回输入手机号
              </button>

              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-start">
                  <i className="ri-information-line text-blue-500 mt-0.5 mr-2"></i>
                  <div className="text-xs text-blue-600">
                    <p className="font-medium mb-1">测试提示：</p>
                    <p>• 输入验证码：123456</p>
                    <p>• 或使用手机号：18938380887（任意验证码）</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              登录即表示同意相关服务条款
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 如果显示查询页面
  if (showSearchPage) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-10">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setShowSearchPage(false)}
              className="w-8 h-8 flex items-center justify-center"
            >
              <i className="ri-arrow-left-line text-gray-600 text-lg"></i>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">物品查询</h1>
            <div className="w-8"></div>
          </div>
        </div>

        <div className="pt-16 px-4 pb-4">
          <div className="space-y-3">
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <i className="ri-barcode-line text-gray-400"></i>
                </div>
                <input
                  type="text"
                  placeholder="输入物品代码或扫描二维码"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-3 bg-white rounded-lg border-none shadow-sm text-sm"
                />
              </div>
              <button
                onClick={handleScanQRForSearch}
                className="px-4 py-3 bg-orange-500 text-white rounded-lg flex items-center justify-center"
              >
                <i className="ri-qr-scan-line text-lg"></i>
              </button>
              <button
                onClick={handleSearch}
                className="px-4 py-3 bg-blue-500 text-white rounded-lg flex items-center justify-center"
              >
                <i className="ri-search-line text-lg"></i>
              </button>
            </div>

            {/* 搜索提示信息 */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-start">
                <i className="ri-information-line text-blue-500 mt-0.5 mr-2"></i>
                <div className="text-xs text-blue-600">
                  <p className="font-medium mb-1">支持的查找方式：</p>
                  <p>• 输入物品代码：如 BOOK001</p>
                  <p>• 扫描物品代码二维码</p>
                  <p>• 扫描"代码+日期"二维码：如 BOOK001_2024-01-15</p>
                  <p>• 手动输入"代码+日期"格式进行精确查找</p>
                  <p className="text-orange-600 font-medium mt-1">• 可查询所有用户的物品记录</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 space-y-3 pb-6">
          {searchCode && searchResults.length === 0 && (
            <div className="text-center py-12">
              <i className="ri-search-line text-4xl text-gray-300 mb-2"></i>
              <p className="text-gray-500 mb-2">未找到相关记录</p>
              <div className="text-xs text-gray-400">
                <p>搜索内容：{searchCode}</p>
                {searchCode.includes('_') && (
                  <p>精确匹配模式：物品代码 + 放置日期</p>
                )}
              </div>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center mb-3">
                <i className="ri-search-line text-green-500 mr-2"></i>
                <span className="text-sm text-gray-600">
                  找到 {searchResults.length} 条记录
                  {searchCode.includes('_') && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                      精确匹配
                    </span>
                  )}
                </span>
              </div>
            </div>
          )}

          {searchResults.map((item) => (
            <div key={item.id} className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {item.id}
                </span>
                <button
                  onClick={() => handleGenerateQR(item)}
                  className="w-6 h-6 bg-purple-500 rounded flex items-center justify-center"
                >
                  <i className="ri-qr-code-line text-white text-xs"></i>
                </button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-gray-500">物品代码</span>
                    <div className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded mt-1">
                      {item.itemCode}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">物品名称</span>
                    <div className="text-sm font-medium text-gray-900 mt-1">
                      {item.itemName}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-gray-500">存放位置</span>
                  <div className="flex items-center mt-1">
                    <i className="ri-map-pin-line text-gray-400 mr-2"></i>
                    <span className="text-sm text-gray-700">{item.location}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-gray-500">创建日期</span>
                    <div className="text-sm text-gray-700 mt-1">{item.placedAt}</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">记录时间</span>
                    <div className="text-sm text-gray-700 mt-1">{item.recordedAt}</div>
                  </div>
                </div>

                <div className="border-t pt-3 space-y-2">
                  <div className="flex items-center">
                    <i className="ri-user-line text-gray-400 mr-2"></i>
                    <span className="text-xs text-gray-500">创建者：</span>
                    <span className="text-sm text-gray-700 ml-1">{item.createdBy}</span>
                  </div>
                  <div className="flex items-center">
                    <i className="ri-smartphone-line text-gray-400 mr-2"></i>
                    <span className="text-xs text-gray-500">手机号：</span>
                    <span className="text-sm text-gray-700 ml-1">{item.createdByPhone}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* PWA安装提示组件 */}
      <PWAInstallPrompt />
      
      {/* 主页面内容 */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <h1 className="text-lg font-semibold text-gray-900">共享物品管理</h1>
            <div className="ml-3 text-xs text-gray-500 bg-green-100 px-2 py-1 rounded">
              {currentUser?.username}
            </div>
            {items.length > 0 && (
              <div className="ml-2 text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded">
                {items.length}个物品（共享）
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSearchPage(true)}
              className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center"
            >
              <i className="ri-search-line text-white text-lg"></i>
            </button>
            <button
              onClick={() => setShowLocationManager(true)}
              className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
            >
              <i className="ri-settings-3-line text-white text-lg"></i>
            </button>
            <button
              onClick={handleShowAddForm}
              className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center"
            >
              <i className="ri-add-line text-white text-lg"></i>
            </button>
            <button
              onClick={handleLogout}
              className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center"
            >
              <i className="ri-logout-box-line text-white text-lg"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="pt-16 px-4 pb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
            <i className="ri-search-line text-gray-400"></i>
          </div>
          <input
            type="text"
            placeholder="搜索共享物品记录"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white rounded-lg border-none shadow-sm text-sm"
          />
        </div>
        
        {/* 添加共享功能说明 */}
        <div className="mt-2 bg-green-50 p-3 rounded-lg">
          <div className="flex items-start">
            <i className="ri-share-line text-green-500 mt-0.5 mr-2"></i>
            <div className="text-xs text-green-600">
              <p className="font-medium mb-1">共享物品管理：</p>
              <p>• 同一物品代码+创建日期 = 同一个物品</p>
              <p>• 任何人都可以更新物品的存放位置</p>
              <p>• 系统记录所有人的使用历史</p>
              <p>• 点击物品可查看详细使用记录</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-3 pb-20">
        {isLoading && items.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">加载中...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {item.itemCode}_{item.placedAt}
                  </span>
                  <span className="text-xs text-green-500 bg-green-50 px-2 py-1 rounded">
                    共享物品
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleShowUsageHistory(item)}
                    className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center"
                    title="查看使用历史"
                  >
                    <i className="ri-history-line text-white text-xs"></i>
                  </button>
                  <button
                    onClick={() => handleShowUpdateLocation(item)}
                    className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center"
                    title="更新位置"
                  >
                    <i className="ri-map-pin-line text-white text-xs"></i>
                  </button>
                  <button
                    onClick={() => handleGenerateQR(item)}
                    className="w-6 h-6 bg-purple-500 rounded flex items-center justify-center"
                    title="生成二维码"
                  >
                    <i className="ri-qr-code-line text-white text-xs"></i>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded mr-2">
                    {item.itemCode}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{item.itemName}</span>
                </div>

                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center mb-2">
                    <i className="ri-map-pin-line text-green-500 mr-2"></i>
                    <span className="text-sm font-medium text-green-700">当前位置：{item.location}</span>
                  </div>
                  <div className="flex items-center">
                    <i className="ri-user-line text-green-500 mr-2"></i>
                    <span className="text-xs text-green-600">
                      最后更新：{item.lastUpdatedBy} ({item.lastUpdatedByPhone}) - {item.lastUpdatedAt}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-3 space-y-2">
                  <div className="flex items-center">
                    <i className="ri-calendar-line text-gray-400 mr-2"></i>
                    <span className="text-xs text-gray-500">创建日期：{item.placedAt}</span>
                  </div>
                  <div className="flex items-center">
                    <i className="ri-user-add-line text-gray-400 mr-2"></i>
                    <span className="text-xs text-gray-500">
                      创建者：{item.createdBy} ({item.createdByPhone}) - {item.recordedAt}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <i className="ri-share-line text-4xl text-gray-300 mb-2"></i>
            <p className="text-gray-500">
              {items.length === 0 ? '暂无共享物品记录' : '没有匹配的记录'}
            </p>
            {items.length === 0 && (
              <button
                onClick={handleShowAddForm}
                className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
              >
                创建第一个共享物品
              </button>
            )}
          </div>
        )}
      </div>

      {/* 更新位置弹窗 */}
      {showUpdateLocationForm && itemToUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">更新物品位置</h2>
              <button
                onClick={() => {
                  setShowUpdateLocationForm(false);
                  setItemToUpdate(null);
                  setNewLocationForUpdate('');
                }}
                className="w-8 h-8 flex items-center justify-center"
              >
                <i className="ri-close-line text-gray-400 text-xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <i className="ri-barcode-line text-blue-500 mr-2"></i>
                    <span className="text-sm font-medium text-blue-700">
                      物品：{itemToUpdate.itemCode} - {itemToUpdate.itemName}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <i className="ri-calendar-line text-blue-500 mr-2"></i>
                    <span className="text-sm text-blue-600">创建日期：{itemToUpdate.placedAt}</span>
                  </div>
                  <div className="flex items-center">
                    <i className="ri-map-pin-line text-blue-500 mr-2"></i>
                    <span className="text-sm text-blue-600">当前地点：{itemToUpdate.location}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  新的存放位置 <span className="text-red-500">*</span>
                </label>
                <select
                  value={newLocationForUpdate}
                  onChange={(e) => setNewLocationForUpdate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-white"
                  disabled={isLoading}
                >
                  <option value="">选择新的存放位置</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.name}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-start">
                  <i className="ri-information-line text-green-500 mt-0.5 mr-2"></i>
                  <div className="text-xs text-green-600">
                    <p className="font-medium mb-1">更新说明：</p>
                    <p>• 任何人都可以更新共享物品的位置</p>
                    <p>• 系统将记录您的更新操作</p>
                    <p>• 其他用户可以查看完整的使用历史</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                <div className="flex items-center">
                  <i className="ri-user-line text-gray-400 mr-2"></i>
                  <span className="text-sm text-gray-600">更新者：{currentUser?.username}</span>
                </div>
                <div className="flex items-center">
                  <i className="ri-smartphone-line text-gray-400 mr-2"></i>
                  <span className="text-sm text-gray-600">手机号：{currentUser?.phoneNumber}</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowUpdateLocationForm(false);
                  setItemToUpdate(null);
                  setNewLocationForUpdate('');
                }}
                disabled={isLoading}
                className="flex-1 py-3 border border-gray-200 rounded-lg text-gray-600 font-medium disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleConfirmUpdateLocation}
                disabled={isLoading || !newLocationForUpdate.trim()}
                className="flex-1 py-3 bg-green-500 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {isLoading ? '更新中...' : '确认更新'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 使用历史弹窗 */}
      {showUsageHistory && selectedItemForHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">使用历史</h2>
              <button
                onClick={() => {
                  setShowUsageHistory(false);
                  setSelectedItemForHistory(null);
                }}
                className="w-8 h-8 flex items-center justify-center"
              >
                <i className="ri-close-line text-gray-400 text-xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <i className="ri-barcode-line text-blue-500 mr-2"></i>
                    <span className="text-sm font-medium text-blue-700">
                      {selectedItemForHistory.itemCode} - {selectedItemForHistory.itemName}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <i className="ri-calendar-line text-blue-500 mr-2"></i>
                    <span className="text-sm text-blue-600">创建日期：{selectedItemForHistory.placedAt}</span>
                  </div>
                  <div className="flex items-center">
                    <i className="ri-map-pin-line text-blue-500 mr-2"></i>
                    <span className="text-sm text-blue-600">当前位置：{selectedItemForHistory.location}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700 flex items-center">
                  <i className="ri-history-line text-gray-500 mr-2"></i>
                  使用历史记录
                </h3>

                {selectedItemForHistory.usageHistory && selectedItemForHistory.usageHistory.length > 0 ? (
                  selectedItemForHistory.usageHistory.map((history) => (
                    <div key={history.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${
                            history.action === 'created' ? 'bg-green-400' :
                            history.action === 'moved' ? 'bg-blue-400' : 'bg-orange-400'
                          }`}></div>
                          <span className="text-sm font-medium text-gray-900">
                            {history.action === 'created' ? '创建物品' :
                             history.action === 'moved' ? '移动位置' : '使用物品'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(history.updatedAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <i className="ri-map-pin-line text-gray-400 mr-2"></i>
                          <span className="text-sm text-gray-600">位置：{history.location}</span>
                        </div>
                        <div className="flex items-center">
                          <i className="ri-user-line text-gray-400 mr-2"></i>
                          <span className="text-sm text-gray-600">
                            操作者：{history.updatedBy} ({history.updatedByPhone})
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <i className="ri-history-line text-4xl text-gray-300 mb-2"></i>
                    <p className="text-gray-500">暂无使用历史记录</p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                setShowUsageHistory(false);
                setSelectedItemForHistory(null);
              }}
              className="w-full mt-6 py-3 bg-blue-500 text-white rounded-lg font-medium"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* 编辑地点弹窗 */}
      {showEditLocation && editingLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">编辑存放地点</h2>
              <button
                onClick={handleCancelEditLocation}
                className="w-8 h-8 flex items-center justify-center"
              >
                <i className="ri-close-line text-gray-400 text-xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  地点名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editLocationData.name}
                  onChange={(e) => setEditLocationData({ ...editLocationData, name: e.target.value })}
                  placeholder="请输入地点名称"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  地点描述
                </label>
                <textarea
                  value={editLocationData.description}
                  onChange={(e) => setEditLocationData({ ...editLocationData, description: e.target.value })}
                  placeholder="请输入地点描述（选填）"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm resize-none"
                  disabled={isLoading}
                />
              </div>

              {editingLocation && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-start">
                    <i className="ri-information-line text-blue-500 mt-0.5 mr-2"></i>
                    <div className="text-xs text-blue-600">
                      <p className="font-medium mb-1">修改提醒：</p>
                      <p>• 当前有 {items.filter(item => item.location === editingLocation.name).length} 个物品使用此地点</p>
                      <p>• 修改地点名称后，所有相关物品的位置信息将自动更新</p>
                      <p>• 任何人都可以编辑地点信息</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCancelEditLocation}
                disabled={isLoading}
                className="flex-1 py-3 border border-gray-200 rounded-lg text-gray-600 font-medium disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleSaveEditLocation}
                disabled={isLoading}
                className="flex-1 py-3 bg-blue-500 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {isLoading ? '保存中...' : '保存修改'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 添加物品记录弹窗 */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">添加物品记录</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="w-8 h-8 flex items-center justify-center"
              >
                <i className="ri-close-line text-gray-400 text-xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  物品代码 <span className="text-red-5">*</span>
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newItem.itemCode}
                    onChange={(e) => setNewItem({ ...newItem, itemCode: e.target.value })}
                    placeholder="请输入物品代码"
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-lg text-sm"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleScanQR}
                    disabled={isLoading}
                    className="px-3 py-3 bg-orange-500 text-white rounded-lg flex items-center justify-center disabled:opacity-50"
                    title="扫描物品代码"
                  >
                    <i className="ri-qr-scan-line text-base"></i>
                  </button>
                  <button
                    onClick={handleShowQRWithDateGenerator}
                    disabled={isLoading}
                    className="px-3 py-3 bg-purple-500 text-white rounded-lg flex items-center justify-center disabled:opacity-50"
                    title="生成代码+日期二维码"
                  >
                    <i className="ri-qr-code-line text-base"></i>
                  </button>
                </div>
                
                <div className="mt-2 bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-start">
                    <i className="ri-information-line text-blue-500 mt-0.5 mr-2"></i>
                    <div className="text-xs text-blue-600">
                      <p className="font-medium mb-1">按钮功能：</p>
                      <p>• 橙色按钮：扫描物品代码二维码</p>
                      <p>• 紫色按钮：生成"物品代码+创建时间"二维码界面</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ... existing code for the rest of the form ... */}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  物品名称
                </label>
                <input
                  type="text"
                  value={newItem.itemName}
                  onChange={(e) => setNewItem({ ...newItem, itemName: e.target.value })}
                  placeholder="请输入物品名称"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  存放位置
                </label>
                <select
                  value={newItem.location}
                  onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-white"
                  disabled={isLoading}
                >
                  <option value="">选择存放位置</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.name}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  创建日期
                </label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-5 mb-1">年份</label>
                    <select
                      value={dateYear}
                      onChange={(e) => handleYearMonthChange(e.target.value, dateMonth)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-white"
                      disabled={isLoading}
                    >
                      <option value="">选择年份</option>
                      {generateYearOptions().map((year) => (
                        <option key={year} value={year}>
                          {year}年
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-5 mb-1">月份</label>
                    <select
                      value={dateMonth}
                      onChange={(e) => handleYearMonthChange(dateYear, e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-white"
                      disabled={!dateYear || isLoading}
                    >
                      <option value="">选择月份</option>
                      {generateMonthOptions().map((month) => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-5 mb-1">日期</label>
                    <select
                      value={dateDay}
                      onChange={(e) => setDateDay(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-white"
                      disabled={!dateYear || !dateMonth || isLoading}
                    >
                      <option value="">选择日期</option>
                      {generateDayOptions().map((day) => (
                        <option key={day.value} value={day.value}>
                          {day.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {dateYear && dateMonth && dateDay && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center">
                        <i className="ri-calendar-line text-blue-500 mr-2"></i>
                        <span className="text-sm text-blue-700">
                          选择的日期：{dateYear}年{parseInt(dateMonth)}月{parseInt(dateDay)}日
                        </span>
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        格式：{dateYear}-{dateMonth}-{dateDay}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-3 pt-3">
                    <button
                      onClick={() => setShowAddForm(false)}
                      disabled={isLoading}
                      className="flex-1 py-3 border border-gray-200 rounded-lg text-gray-600 font-medium disabled:opacity-50"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleAddItem}
                      disabled={isLoading}
                      className="flex-1 py-3 bg-blue-500 text-white rounded-lg font-medium disabled:opacity-50"
                    >
                      {isLoading ? '保存中...' : '保存'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                <div className="flex items-center">
                  <i className="ri-user-line text-gray-400 mr-2"></i>
                  <span className="text-sm text-gray-600">创建者：{currentUser?.username}</span>
                </div>
                <div className="flex items-center">
                  <i className="ri-smartphone-line text-gray-400 mr-2"></i>
                  <span className="text-sm text-gray-600">手机号：{currentUser?.phoneNumber}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 新增：物品代码+日期二维码生成界面 */}
      {showQRWithDateGenerator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 flex items-center justify-center">
          <div className="bg-white w-80 rounded-2xl p-6 animate-slide-up mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">物品代码+日期二维码</h2>
              <button
                onClick={() => setShowQRWithDateGenerator(false)}
                className="w-8 h-8 flex items-center justify-center"
              >
                <i className="ri-close-line text-gray-400 text-xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              {/* 二维码显示区域 */}
              <div className="text-center">
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <img
                    src={getQRCodeUrl(qrWithDateData.generatedQRData)}
                    alt="QR Code with Date"
                    className="w-48 h-48 mx-auto"
                  />
                </div>
              </div>

              {/* 二维码信息 */}
              <div className="space-y-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">物品代码:</span>
                      <span className="font-medium text-blue-700">{qrWithDateData.itemCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">创建日期:</span>
                      <span className="font-medium text-blue-700">{qrWithDateData.placedAt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">二维码内容:</span>
                      <span className="font-medium text-purple-600">{qrWithDateData.generatedQRData}</span>
                    </div>
                  </div>
                </div>

                {/* 编辑区域 */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      物品代码
                    </label>
                    <input
                      type="text"
                      value={qrWithDateData.itemCode}
                      onChange={(e) => {
                        const newItemCode = e.target.value;
                        setQrWithDateData({
                          ...qrWithDateData,
                          itemCode: newItemCode,
                          generatedQRData: `${newItemCode}_${qrWithDateData.placedAt}`
                        });
                      }}
                      placeholder="请输入物品代码"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      创建日期
                    </label>
                    <input
                      type="date"
                      value={qrWithDateData.placedAt}
                      onChange={(e) => {
                        const newPlacedAt = e.target.value;
                        setQrWithDateData({
                          ...qrWithDateData,
                          placedAt: newPlacedAt,
                          generatedQRData: `${qrWithDateData.itemCode}_${newPlacedAt}`
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                </div>

                {/* 使用说明 */}
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-start">
                    <i className="ri-information-line text-green-500 mt-0.5 mr-2"></i>
                    <div className="text-xs text-green-600">
                      <p className="font-medium mb-1">使用方法：</p>
                      <p>• 可以修改物品代码和日期来生成不同的二维码</p>
                      <p>• 扫描此二维码可以快速填入物品信息</p>
                      <p>• 支持物品追踪和管理</p>
                      <p>• 格式：物品代码_创建日期</p>
                    </div>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      // 将二维码数据应用到表单
                      setNewItem({ 
                        ...newItem, 
                        itemCode: qrWithDateData.itemCode 
                      });
                      
                      // 解析日期并设置到日期选择器
                      const dateParts = qrWithDateData.placedAt.split('-');
                      if (dateParts.length === 3) {
                        setDateYear(dateParts[0]);
                        setDateMonth(dateParts[1]);
                        setDateDay(dateParts[2]);
                      }
                      
                      setShowQRWithDateGenerator(false);
                      showAlertMessage('二维码信息已应用到表单');
                    }}
                    className="flex-1 py-2 bg-green-500 text-white rounded-lg font-medium text-sm"
                  >
                    应用到表单
                  </button>
                  <button
                    onClick={() => setShowQRWithDateGenerator(false)}
                    className="flex-1 py-2 bg-gray-500 text-white rounded-lg font-medium text-sm"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 添加存放地点弹窗 */}
      {showLocationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">添加存放地点</h2>
              <button
                onClick={() => setShowLocationForm(false)}
                className="w-8 h-8 flex items-center justify-center"
              >
                <i className="ri-close-line text-gray-400 text-xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  地点名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newLocation.name}
                  onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                  placeholder="请输入地点名称"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  地点描述
                </label>
                <textarea
                  value={newLocation.description}
                  onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
                  placeholder="请输入地点描述（选填）"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm resize-none"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowLocationForm(false)}
                disabled={isLoading}
                className="flex-1 py-3 border border-gray-200 rounded-lg text-gray-600 font-medium disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleAddLocation}
                disabled={isLoading}
                className="flex-1 py-3 bg-green-500 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {isLoading ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 物品二维码生成弹窗 */}
      {showQRGenerator && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 flex items-center justify-center">
          <div className="bg-white w-80 rounded-2xl p-6 animate-slide-up mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">物品二维码</h2>
              <button
                onClick={() => setShowQRGenerator(false)}
                className="w-8 h-8 flex items-center justify-center"
              >
                <i className="ri-close-line text-gray-400 text-xl"></i>
              </button>
            </div>

            <div className="text-center">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <img
                  src={getQRCodeUrl(generateQRData(selectedItem))}
                  alt="QR Code"
                  className="w-48 h-48 mx-auto"
                />
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span className="text-gray-600">物品代码:</span>
                  <span className="font-medium">{selectedItem.itemCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">创建日期:</span>
                  <span className="font-medium">{selectedItem.placedAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">创建者:</span>
                  <span className="font-medium">{selectedItem.createdBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">登记手机:</span>
                  <span className="font-medium">{selectedItem.createdByPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">二维码内容:</span>
                  <span className="font-medium text-blue-600">{generateQRData(selectedItem)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowQRGenerator(false)}
              className="w-full mt-6 py-3 bg-purple-500 text-white rounded-lg font-medium"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && locationToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 flex items-center justify-center">
          <div className="bg-white w-80 rounded-2xl p-6 mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-delete-bin-line text-red-500 text-2xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">确认删除</h3>
              <p className="text-gray-600 mb-6">
                确定要删除地点 "{locationToDelete.name}" 吗？此操作不可撤销。
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleCancelDelete}
                  disabled={isLoading}
                  className="flex-1 py-3 border border-gray-200 rounded-lg text-gray-600 font-medium disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isLoading}
                  className="flex-1 py-3 bg-red-500 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {isLoading ? '删除中...' : '确认删除'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 提示弹窗 */}
      {showAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 flex items-center justify-center">
          <div className="bg-white w-80 rounded-2xl p-6 mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-information-line text-blue-500 text-2xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">提示</h3>
              <p className="text-gray-600 mb-6">
                {alertMessage}
              </p>
              <button
                onClick={() => setShowAlert(false)}
                className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 全局加载遮罩 */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-700">处理中...</span>
          </div>
        </div>
      )}

      {/* 地点管理界面 */}
      {showLocationManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">地点管理</h2>
              <button
                onClick={() => setShowLocationManager(false)}
                className="w-8 h-8 flex items-center justify-center"
              >
                <i className="ri-close-line text-gray-400 text-xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              {/* 添加新地点按钮 */}
              <button
                onClick={() => {
                  setShowLocationManager(false);
                  setShowLocationForm(true);
                }}
                className="w-full py-3 bg-green-500 text-white rounded-lg font-medium flex items-center justify-center space-x-2"
                disabled={isLoading}
              >
                <i className="ri-add-line text-lg"></i>
                <span>添加新地点</span>
              </button>

              {/* 地点列表 */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700 flex items-center">
                  <i className="ri-map-pin-line text-gray-500 mr-2"></i>
                  已创建的存放地点 ({locations.length}个)
                </h3>

                {locations.length > 0 ? (
                  locations.map((location) => {
                    const itemCount = items.filter(item => item.location === location.name).length;
                    return (
                      <div key={location.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{location.name}</div>
                            {location.description && (
                              <div className="text-sm text-gray-600 mt-1">{location.description}</div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                              {itemCount}个物品
                            </span>
                            <button
                              onClick={() => {
                                setShowLocationManager(false);
                                handleShowEditLocation(location);
                              }}
                              className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center"
                              title="编辑地点"
                            >
                              <i className="ri-edit-line text-white text-sm"></i>
                            </button>
                            <button
                              onClick={() => {
                                setShowLocationManager(false);
                                handleShowDeleteLocation(location);
                              }}
                              className="w-8 h-8 bg-red-500 rounded flex items-center justify-center"
                              title="删除地点"
                              disabled={itemCount > 0}
                            >
                              <i className="ri-delete-bin-line text-white text-sm"></i>
                            </button>
                          </div>
                        </div>

                        {itemCount > 0 && (
                          <div className="border-t pt-3 mt-3">
                            <div className="text-xs text-gray-500 mb-2">使用此地点的物品：</div>
                            <div className="flex flex-wrap gap-1">
                              {items.filter(item => item.location === location.name).slice(0, 5).map((item) => (
                                <span key={item.id} className="text-xs bg-white px-2 py-1 rounded border">
                                  {item.itemCode}
                                </span>
                              ))}
                              {itemCount > 5 && (
                                <span className="text-xs text-gray-500 px-2 py-1">
                                  +{itemCount - 5}个更多...
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <i className="ri-map-pin-line text-4xl text-gray-300 mb-2"></i>
                    <p className="text-gray-500 mb-4">暂无存放地点</p>
                    <button
                      onClick={() => {
                        setShowLocationManager(false);
                        setShowLocationForm(true);
                      }}
                      className="px-6 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
                    >
                      创建第一个地点
                    </button>
                  </div>
                )}
              </div>

              {/* 使用说明 */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-start">
                  <i className="ri-information-line text-blue-500 mt-0.5 mr-2"></i>
                  <div className="text-xs text-blue-600">
                    <p className="font-medium mb-1">地点管理说明：</p>
                    <p>• 绿色按钮：添加新的存放地点</p>
                    <p>• 蓝色按钮：编辑地点名称和描述</p>
                    <p>• 红色按钮：删除地点（仅当无物品使用时可删除）</p>
                    <p>• 显示每个地点被多少个物品使用</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowLocationManager(false)}
              className="w-full mt-6 py-3 bg-gray-500 text-white rounded-lg font-medium"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
