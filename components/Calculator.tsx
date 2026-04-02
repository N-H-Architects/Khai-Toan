import React, { useState, useMemo, useEffect } from 'react';
import { Card } from './ui/Card';
import { InputGroup, NumberInput } from './ui/InputGroup';
import { ResultsSidebar } from './ResultsSidebar';
import { CalculatorState, CalculationResult } from '../types';
import { Plus, Trash2, Home, Layers, DollarSign } from 'lucide-react';

const INITIAL_STATE: CalculatorState = {
  floors: [
    { id: 'f1', name: 'Tầng 1', area: 0 },
    { id: 'f2', name: 'Tầng 2', area: 0 },
  ],
  mezzanine: { area: 0, coef: 65 },
  balcony: { area: 0, coef: 40 },
  terraceIn: { area: 0, coef: 100 },
  terraceOut: { area: 0, coef: 50 },
  roof: { area: 0, coef: 50 },
  garden: { area: 0 },
  basement: { area: 0, depth: 0, coef: 150 },
  
  pile: {
    concrete: { length: 0, price: 0 },
    bored: { length: 0, price: 0 },
    bamboo: { quantity: 0, price: 0 },
  },
  fenceFront: { length: 0, price: 5000000 },
  fenceRear: { length: 0, price: 2500000 },
  foundationCap: { coef: 30 },
  foundationType: 100,
  roofType: 0,
  
  priceRough: 4400000,
  priceFinish: 3600000,
  pricePackage: 0,
  priceInteriorFinish: 0,
  priceGarden: 1500000,
  
  // Design Fees V5
  priceDesignArch: 200000,
  areaInteriorFinish: 0,
  areaDesignInterior: 0,
  priceDesignInterior: 150000,
  areaDesignLandscape: 0,
  priceDesignLandscape: 110000,

  percentSupervision: 0,
  percentAsbuilt: 0,
  percentContingency: 10,
  costPermit: 0,
};

export const Calculator: React.FC = () => {
  const [state, setState] = useState<CalculatorState>(INITIAL_STATE);

  // --- Handlers ---
  const updateState = (path: keyof CalculatorState, value: any) => {
    setState(prev => ({ ...prev, [path]: value }));
  };

  const updateNested = (parent: keyof CalculatorState, field: string, value: number) => {
    setState(prev => ({
      ...prev,
      [parent]: { ...prev[parent] as any, [field]: value }
    }));
  };

  const updatePile = (type: keyof CalculatorState['pile'], field: string, value: number) => {
    setState(prev => ({
      ...prev,
      pile: {
        ...prev.pile,
        [type]: {
          ...prev.pile[type],
          [field]: value
        }
      }
    }));
  };

  const addFloor = () => {
    setState(prev => ({
      ...prev,
      floors: [
        ...prev.floors,
        { id: `f${Date.now()}`, name: `Tầng ${prev.floors.length + 1}`, area: 0 }
      ]
    }));
  };

  const removeFloor = (id: string) => {
    setState(prev => ({
      ...prev,
      floors: prev.floors.filter(f => f.id !== id).map((f, idx) => ({ ...f, name: `Tầng ${idx + 1}` }))
    }));
  };

  const updateFloor = (id: string, val: number) => {
    setState(prev => ({
      ...prev,
      floors: prev.floors.map(f => f.id === id ? { ...f, area: val } : f)
    }));
  };

  // --- Effects ---

  // Auto-calculate basement coefficient based on depth
  useEffect(() => {
    if (state.basement.depth > 0) {
      let newCoef = 150;
      if (state.basement.depth > 1.5) newCoef = 170;
      if (state.basement.depth > 2.0) newCoef = 200;
      
      if (newCoef !== state.basement.coef) {
        updateNested('basement', 'coef', newCoef);
      }
    }
  }, [state.basement.depth]);

  // Update roof coefficient from dropdown selection
  const handleRoofTypeChange = (val: number) => {
    updateState('roofType', val);
    if (val > 0) updateNested('roof', 'coef', val);
  };

  // Update foundation coefficient from dropdown selection
  const handleFoundationTypeChange = (val: number) => {
    updateState('foundationType', val);
    // Typical values map directly to coefficient, except 0 (Manual) or 100 (Pile - default cap 30 or manual)
    if (val === 20 || val === 50) {
      updateNested('foundationCap', 'coef', val);
    }
  };

  // --- Calculation Logic ---
  const result: CalculationResult = useMemo(() => {
    let totalArea = 0;
    const details: CalculationResult['details'] = [];

    // Floors
    state.floors.forEach(f => {
      if (f.area > 0) {
        totalArea += f.area;
        details.push({ name: f.name, pct: 100, area: f.area });
      }
    });

    // Helper for simple additions
    const addPart = (name: string, area: number, coef: number) => {
      if (area > 0) {
        const converted = area * (coef / 100);
        totalArea += converted;
        details.push({ name, pct: coef, area: converted });
      }
    };

    addPart('Tầng lửng', state.mezzanine.area, state.mezzanine.coef);
    addPart('Ban công', state.balcony.area, state.balcony.coef);
    addPart('Sân thượng (Trong)', state.terraceIn.area, state.terraceIn.coef);
    addPart('Sân thượng (Ngoài)', state.terraceOut.area, state.terraceOut.coef);
    addPart('Tầng hầm', state.basement.area, state.basement.coef);
    
    // Roof is added to construction area for unit price calculation
    addPart('Mái', state.roof.area, state.roof.coef);

    // Foundation Cap (Based on Floor 1 area)
    const floor1Area = state.floors[0]?.area || 0;
    let foundationCapArea = 0;
    if (floor1Area > 0 && state.foundationCap.coef > 0) {
      const converted = floor1Area * (state.foundationCap.coef / 100);
      foundationCapArea = converted;
      totalArea += converted;
      details.push({ name: 'Đài móng', pct: state.foundationCap.coef, area: converted });
    }

    // Costs Calculation
    const hasComponentPrices = state.priceRough > 0 || state.priceFinish > 0;
    // Prioritize Package Price if Rough/Finish are empty, or user explicitly entered it
    const usePackagePrice = state.pricePackage > 0 && !hasComponentPrices;

    let costRough = 0;
    let costFinish = 0;
    
    if (usePackagePrice) {
        costRough = totalArea * state.pricePackage;
        costFinish = 0; // Will be displayed as included
    } else {
        costRough = totalArea * state.priceRough;
        costFinish = totalArea * state.priceFinish;
    }

    const costConstruction = costRough + costFinish;
    
    const costInteriorFinish = state.areaInteriorFinish * state.priceInteriorFinish;

    // Calculate total pile cost from 3 types
    const costPile = 
      (state.pile.concrete.length * state.pile.concrete.price) +
      (state.pile.bored.length * state.pile.bored.price) +
      (state.pile.bamboo.quantity * state.pile.bamboo.price);

    const costGarden = state.garden.area * state.priceGarden;
    const costFenceFront = state.fenceFront.length * state.fenceFront.price;
    const costFenceRear = state.fenceRear.length * state.fenceRear.price;
    const costFence = costFenceFront + costFenceRear;

    const hardCost = costConstruction + costPile + costGarden + costFence + costInteriorFinish;

    // Design Fees
    // Architecture area = Total Construction Area - Foundation Cap Area
    const areaDesignArch = Math.max(0, totalArea - foundationCapArea);
    const costDesignArch = areaDesignArch * state.priceDesignArch;
    
    // Calculate ratio relative to house construction cost
    const designArchRatio = costConstruction > 0 ? (costDesignArch / costConstruction) * 100 : 0;

    const costDesignInterior = state.areaDesignInterior * state.priceDesignInterior;
    const designInteriorRatio = costConstruction > 0 ? (costDesignInterior / costConstruction) * 100 : 0;

    const costDesignLandscape = state.areaDesignLandscape * state.priceDesignLandscape;
    const designLandscapeRatio = costConstruction > 0 ? (costDesignLandscape / costConstruction) * 100 : 0;

    const totalDesignCost = costDesignArch + costDesignInterior + costDesignLandscape;

    // Other Service Costs (Percent of House Construction Cost only)
    const costSupervision = costConstruction * (state.percentSupervision / 100);
    const costAsbuilt = costConstruction * (state.percentAsbuilt / 100);
    
    // Contingency is calculated on Total Hard Cost (House + Pile + Garden)
    const costContingency = hardCost * (state.percentContingency / 100);

    return {
      details,
      totalConstructionArea: totalArea,
      areaInteriorFinish: state.areaInteriorFinish,
      costRough,
      costFinish,
      costInteriorFinish,
      costConstruction,
      costPile,
      costGarden,
      costFenceFront,
      costFenceRear,
      costFence,
      hardCost,
      costDesignArch,
      designArchRatio,
      costDesignInterior,
      designInteriorRatio,
      costDesignLandscape,
      designLandscapeRatio,
      totalDesignCost,
      costSupervision,
      costAsbuilt,
      costPermit: state.costPermit,
      costContingency,
      grandTotal: hardCost + totalDesignCost + costSupervision + costAsbuilt + state.costPermit + costContingency,
      usePackagePrice
    };
  }, [state]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* --- Left Column: Inputs --- */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Section I: Areas */}
        <Card title="I. Diện tích xây dựng" headerAction={<Home className="text-blue-600" size={20} />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
            {state.floors.map((floor, idx) => (
              <InputGroup key={floor.id} label={`${floor.name} (m²)`}>
                 <NumberInput 
                    value={floor.area} 
                    onValueChange={(v) => updateFloor(floor.id, v)} 
                    placeholder="0"
                    suffix="m²"
                  />
                  {idx > 1 && (
                    <button 
                      onClick={() => removeFloor(floor.id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
              </InputGroup>
            ))}
          </div>

          <div className="mt-2 mb-6">
             <button 
              onClick={addFloor}
              className="flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={16} /> Thêm tầng
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-4 border-t border-dashed border-gray-200">
            <InputGroup label="Tầng lửng" subLabel="Hệ số mặc định 65%">
              <NumberInput value={state.mezzanine.area} onValueChange={(v) => updateNested('mezzanine', 'area', v)} placeholder="DT" suffix="m²" />
              <NumberInput value={state.mezzanine.coef} onValueChange={(v) => updateNested('mezzanine', 'coef', v)} className="max-w-[100px]" suffix="%" />
            </InputGroup>

            <InputGroup label="Ban công (Tổng)" subLabel="Hệ số 30-50%">
              <NumberInput value={state.balcony.area} onValueChange={(v) => updateNested('balcony', 'area', v)} placeholder="DT" suffix="m²" />
              <NumberInput value={state.balcony.coef} onValueChange={(v) => updateNested('balcony', 'coef', v)} className="max-w-[100px]" suffix="%" />
            </InputGroup>

            <InputGroup label="Sân thượng (Trong nhà)" subLabel="Hệ số 80-100%">
              <NumberInput value={state.terraceIn.area} onValueChange={(v) => updateNested('terraceIn', 'area', v)} placeholder="DT" suffix="m²" />
              <NumberInput value={state.terraceIn.coef} onValueChange={(v) => updateNested('terraceIn', 'coef', v)} className="max-w-[100px]" suffix="%" />
            </InputGroup>

            <InputGroup label="Sân thượng (Ngoài nhà)" subLabel="Hệ số 50-70%">
              <NumberInput value={state.terraceOut.area} onValueChange={(v) => updateNested('terraceOut', 'area', v)} placeholder="DT" suffix="m²" />
              <NumberInput value={state.terraceOut.coef} onValueChange={(v) => updateNested('terraceOut', 'coef', v)} className="max-w-[100px]" suffix="%" />
            </InputGroup>

             {/* Roof Area - Blue Box */}
             <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 h-fit">
                <InputGroup label="Diện tích Mái (m²)" className="!mb-0" labelClassName="text-blue-800 font-bold">
                  <NumberInput value={state.roof.area} onValueChange={(v) => updateNested('roof', 'area', v)} placeholder="Nhập DT sàn mái" suffix="m²" />
                  <NumberInput value={state.roof.coef} onValueChange={(v) => updateNested('roof', 'coef', v)} className="max-w-[100px] font-bold text-blue-700" suffix="%" />
                </InputGroup>
                <p className="text-xs text-blue-600 mt-2 italic">Hệ số này tự nhảy khi chọn loại Mái ở phần II</p>
             </div>

            <InputGroup label="Diện tích Sân vườn">
              <NumberInput value={state.garden.area} onValueChange={(v) => updateNested('garden', 'area', v)} placeholder="0" suffix="m²" />
            </InputGroup>
          </div>

          {/* Basement Section */}
          <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
            <h4 className="font-semibold text-gray-700 mb-3 text-sm">Tầng hầm</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <InputGroup label="Diện tích (m²)" className="mb-0">
                <NumberInput value={state.basement.area} onValueChange={(v) => updateNested('basement', 'area', v)} />
              </InputGroup>
               <InputGroup label="Độ sâu (m)" className="mb-0">
                <NumberInput value={state.basement.depth} onValueChange={(v) => updateNested('basement', 'depth', v)} step={0.1} />
              </InputGroup>
               <InputGroup label="Hệ số (%)" className="mb-0">
                <NumberInput value={state.basement.coef} onValueChange={(v) => updateNested('basement', 'coef', v)} />
              </InputGroup>
            </div>
          </div>
        </Card>

        {/* Section II: Foundation & Roof */}
        <Card title="II. Móng - Cọc - Hình thức Mái" headerAction={<Layers className="text-purple-600" size={20} />}>
           
           <div className="col-span-1 md:col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                <label className="block text-sm font-bold text-blue-800 mb-3 uppercase">Chi phí Ép cọc</label>
                
                {/* Pile Type 1 */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-3 items-start sm:items-end">
                    <div className="w-full sm:w-1/3">
                        <label className="text-xs font-bold text-gray-700 mb-1 block">1. Cọc BTCT đúc sẵn</label>
                        <div className="hidden sm:block h-8"></div> {/* Spacer for alignment */}
                    </div>
                    <div className="w-full sm:w-1/3">
                        <NumberInput 
                            value={state.pile.concrete.length} 
                            onValueChange={(v) => updatePile('concrete', 'length', v)} 
                            placeholder="Tổng chiều dài (m)" 
                            className="h-9"
                        />
                    </div>
                    <div className="w-full sm:w-1/3">
                        <NumberInput 
                            value={state.pile.concrete.price} 
                            onValueChange={(v) => updatePile('concrete', 'price', v)} 
                            placeholder="Đơn giá (VNĐ/m)" 
                            className="h-9"
                        />
                    </div>
                </div>

                {/* Pile Type 2 */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-3 items-start sm:items-end">
                    <div className="w-full sm:w-1/3">
                        <label className="text-xs font-bold text-gray-700 mb-1 block">2. Cọc Khoan nhồi</label>
                    </div>
                    <div className="w-full sm:w-1/3">
                        <NumberInput 
                            value={state.pile.bored.length} 
                            onValueChange={(v) => updatePile('bored', 'length', v)} 
                            placeholder="Tổng chiều dài (m)" 
                            className="h-9"
                        />
                    </div>
                    <div className="w-full sm:w-1/3">
                        <NumberInput 
                            value={state.pile.bored.price} 
                            onValueChange={(v) => updatePile('bored', 'price', v)} 
                            placeholder="Đơn giá (VNĐ/m)" 
                            className="h-9"
                        />
                    </div>
                </div>

                {/* Pile Type 3 */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-end">
                    <div className="w-full sm:w-1/3">
                        <label className="text-xs font-bold text-gray-700 mb-1 block">3. Cọc tre / Cừ tràm</label>
                    </div>
                    <div className="w-full sm:w-1/3">
                        <NumberInput 
                            value={state.pile.bamboo.quantity} 
                            onValueChange={(v) => updatePile('bamboo', 'quantity', v)} 
                            placeholder="Số lượng (Cây)" 
                            className="h-9"
                        />
                    </div>
                    <div className="w-full sm:w-1/3">
                        <NumberInput 
                            value={state.pile.bamboo.price} 
                            onValueChange={(v) => updatePile('bamboo', 'price', v)} 
                            placeholder="Đơn giá (VNĐ/Cây)" 
                            className="h-9"
                        />
                    </div>
                </div>
            </div>

            {/* Fence Section */}
            <div className="col-span-1 md:col-span-2 bg-emerald-50 p-4 rounded-lg border border-emerald-100 mb-6">
                <label className="block text-sm font-bold text-emerald-800 mb-3 uppercase">Chi phí Hàng rào</label>
                
                {/* Front Fence */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 items-start sm:items-end">
                    <div className="w-full sm:w-1/3">
                        <label className="text-xs font-bold text-gray-700 mb-1 block">1. Hàng rào mặt tiền (md)</label>
                    </div>
                    <div className="w-full sm:w-1/3">
                        <NumberInput 
                            value={state.fenceFront.length} 
                            onValueChange={(v) => updateNested('fenceFront', 'length', v)} 
                            placeholder="Chiều dài (md)" 
                            className="h-9"
                            suffix="md"
                        />
                    </div>
                    <div className="w-full sm:w-1/3">
                        <NumberInput 
                            value={state.fenceFront.price} 
                            onValueChange={(v) => updateNested('fenceFront', 'price', v)} 
                            placeholder="Đơn giá (VNĐ/md)" 
                            className="h-9"
                            suffix="đ/md"
                        />
                    </div>
                </div>

                {/* Rear Fence */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-end">
                    <div className="w-full sm:w-1/3">
                        <label className="text-xs font-bold text-gray-700 mb-1 block">2. Hàng rào 3 mặt sau (md)</label>
                    </div>
                    <div className="w-full sm:w-1/3">
                        <NumberInput 
                            value={state.fenceRear.length} 
                            onValueChange={(v) => updateNested('fenceRear', 'length', v)} 
                            placeholder="Chiều dài (md)" 
                            className="h-9"
                            suffix="md"
                        />
                    </div>
                    <div className="w-full sm:w-1/3">
                        <NumberInput 
                            value={state.fenceRear.price} 
                            onValueChange={(v) => updateNested('fenceRear', 'price', v)} 
                            placeholder="Đơn giá (VNĐ/md)" 
                            className="h-9"
                            suffix="đ/md"
                        />
                    </div>
                </div>
            </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputGroup label="Đài móng (% DT Tầng 1)" subLabel="Thường 20-40%">
                <NumberInput value={state.foundationCap.coef} onValueChange={(v) => updateNested('foundationCap', 'coef', v)} suffix="%" />
              </InputGroup>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Hệ số loại móng</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  value={state.foundationType}
                  onChange={(e) => handleFoundationTypeChange(parseInt(e.target.value))}
                >
                    <option value="0">Tự nhập tay</option>
                    <option value="20">Móng đơn (20%)</option>
                    <option value="50">Móng băng (50%)</option>
                    <option value="100">Móng cọc (Đài móng tính riêng)</option>
                </select>
              </div>

              <div className="md:col-span-2 border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">4. Hình thức mái</label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-yellow-50 font-medium"
                      value={state.roofType}
                      onChange={(e) => handleRoofTypeChange(parseInt(e.target.value))}
                    >
                      <option value="0">-- Chọn hình thức mái --</option>
                      <option value="30">Mái tôn (30%)</option>
                      <option value="50">Mái bằng bê tông cốt thép (50%)</option>
                      <option value="70">Mái ngói vì kèo (70%)</option>
                      <option value="100">Mái bê tông cốt thép dán ngói (100%)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Tự áp hệ số (%)</label>
                    <NumberInput 
                      value={state.roof.coef} 
                      onValueChange={(v) => updateNested('roof', 'coef', v)} 
                      suffix="%" 
                      className="bg-white"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 italic">Lưu ý: Hệ số % sẽ áp dụng cho diện tích sàn mái tương ứng.</p>
              </div>
           </div>
        </Card>

        {/* Section III: Prices */}
        <Card title="III. Đơn giá & Chi phí khác" headerAction={<DollarSign className="text-emerald-600" size={20} />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
               {/* Split Prices - Yellow Box */}
               <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="text-xs text-yellow-800 mb-3 italic">Nhập tách biệt để xem báo cáo chi tiết theo 4 nhóm:</p>
                  
                  <InputGroup label="1. Đơn giá Phần thô + NC Hoàn thiện" className="!mb-3" labelClassName="text-blue-700">
                    <NumberInput value={state.priceRough} onValueChange={(v) => updateState('priceRough', v)} suffix="đ/m²" />
                  </InputGroup>
                  <InputGroup label="2. Đơn giá Hoàn thiện (Vật tư)" className="!mb-3" labelClassName="text-green-700">
                    <NumberInput value={state.priceFinish} onValueChange={(v) => updateState('priceFinish', v)} suffix="đ/m²" />
                  </InputGroup>
                  <InputGroup label="3. Đơn giá Hoàn thiện Nội thất" className="!mb-0" labelClassName="text-orange-700">
                    <div className="flex gap-2">
                      <NumberInput value={state.areaInteriorFinish} onValueChange={(v) => updateState('areaInteriorFinish', v)} placeholder="DT (m²)" suffix="m²" />
                      <NumberInput value={state.priceInteriorFinish} onValueChange={(v) => updateState('priceInteriorFinish', v)} placeholder="Giá/m²" suffix="đ/m²" />
                    </div>
                  </InputGroup>
               </div>
              
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-2 text-xs text-gray-400">Hoặc nhập Đơn giá Trọn gói</span>
                </div>
              </div>

               <InputGroup label="Đơn giá Trọn gói (Gộp mục 1 & 2)">
                <NumberInput value={state.pricePackage} onValueChange={(v) => updateState('pricePackage', v)} placeholder="Ví dụ: 8.000.000" suffix="đ/m²" />
              </InputGroup>

              <InputGroup label="Đơn giá Sân vườn">
                <NumberInput value={state.priceGarden} onValueChange={(v) => updateState('priceGarden', v)} suffix="đ/m²" />
              </InputGroup>
            </div>

            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 h-fit">
              <h4 className="font-bold text-gray-800 mb-2 text-sm uppercase">Các chi phí dịch vụ</h4>
              <p className="text-xs text-gray-500 mb-3 italic">Tính trên chi phí xây nhà (Thô + Hoàn thiện)</p>

              <div className="space-y-3">
                 <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Phí giám sát</span>
                    <NumberInput value={state.percentSupervision} onValueChange={(v) => updateState('percentSupervision', v)} className="max-w-[80px]" suffix="%" />
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Phí hoàn công</span>
                    <NumberInput value={state.percentAsbuilt} onValueChange={(v) => updateState('percentAsbuilt', v)} className="max-w-[80px]" suffix="%" />
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Giấy phép xây dựng</span>
                    <NumberInput value={state.costPermit} onValueChange={(v) => updateState('costPermit', v)} className="max-w-[120px]" suffix="đ" />
                 </div>
                 <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-red-500">Dự phòng phí</span>
                      <span className="text-[10px] text-gray-400">Trên tổng mức ĐT</span>
                    </div>
                    <NumberInput value={state.percentContingency} onValueChange={(v) => updateState('percentContingency', v)} className="max-w-[80px]" suffix="%" />
                 </div>

                 {/* New Design Fee Section V5 */}
                 <div className="pt-3 mt-4 border-t border-purple-200">
                    <label className="block text-sm font-bold text-purple-700 mb-2">4. Chi phí Thiết kế</label>
                    
                    {/* Architecture */}
                    <div className="mb-3">
                      <label className="text-xs block font-semibold text-gray-700 mb-1">a. Kiến trúc, KC, Điện nước</label>
                      <p className="text-[10px] text-gray-500 mb-1">DT tính = DTXD quy đổi - Đài móng</p>
                      <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 whitespace-nowrap">Đơn giá:</span>
                          <NumberInput value={state.priceDesignArch} onValueChange={(v) => updateState('priceDesignArch', v)} className="h-8 text-sm" />
                      </div>
                    </div>

                    {/* Interior */}
                    <div className="mb-3">
                      <label className="text-xs block font-semibold text-gray-700 mb-1">b. Thiết kế Nội thất</label>
                      <div className="flex gap-2">
                          <NumberInput value={state.areaDesignInterior} onValueChange={(v) => updateState('areaDesignInterior', v)} placeholder="DT (m²)" className="h-8 text-sm" />
                          <NumberInput value={state.priceDesignInterior} onValueChange={(v) => updateState('priceDesignInterior', v)} placeholder="Giá/m²" className="h-8 text-sm" />
                      </div>
                    </div>

                    {/* Landscape */}
                    <div>
                      <label className="text-xs block font-semibold text-gray-700 mb-1">c. Thiết kế Cảnh quan</label>
                      <div className="flex gap-2">
                          <NumberInput value={state.areaDesignLandscape} onValueChange={(v) => updateState('areaDesignLandscape', v)} placeholder="DT (m²)" className="h-8 text-sm" />
                          <NumberInput value={state.priceDesignLandscape} onValueChange={(v) => updateState('priceDesignLandscape', v)} placeholder="Giá/m²" className="h-8 text-sm" />
                      </div>
                    </div>

                 </div>
              </div>
            </div>
          </div>
        </Card>

      </div>

      {/* --- Right Column: Results --- */}
      <div className="lg:col-span-4">
        <ResultsSidebar result={result} />
      </div>
    </div>
  );
};