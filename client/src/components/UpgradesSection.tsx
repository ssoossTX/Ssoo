import { useState } from "react";
import { UpgradeItem, UpgradeType } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UpgradesSectionProps {
  upgrades: UpgradeItem[];
  purchaseUpgrade: (upgradeId: string) => void;
  score: number;
  selectedUpgradeType: UpgradeType;
  setSelectedUpgradeType: (type: UpgradeType) => void;
}

export default function UpgradesSection({ 
  upgrades, 
  purchaseUpgrade, 
  score,
  selectedUpgradeType,
  setSelectedUpgradeType
}: UpgradesSectionProps) {
  // Filter upgrades by type
  const filteredUpgrades = upgrades.filter(upgrade => upgrade.type === selectedUpgradeType);
  
  const handleTabChange = (value: string) => {
    setSelectedUpgradeType(value as UpgradeType);
  };
  
  return (
    <section className="w-full max-w-xl">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Upgrades</h2>
      
      <Tabs defaultValue="autoTapper" value={selectedUpgradeType} onValueChange={handleTabChange}>
        <TabsList className="mb-4 border-b border-gray-200 dark:border-gray-700 w-full justify-start rounded-none bg-transparent">
          <TabsTrigger 
            value="autoTapper" 
            className="px-4 py-2 data-[state=active]:text-indigo-600 data-[state=active]:dark:text-indigo-400 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:dark:border-indigo-400 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-none data-[state=active]:shadow-none bg-transparent"
          >
            Auto Tappers
          </TabsTrigger>
          <TabsTrigger 
            value="multiplier" 
            className="px-4 py-2 data-[state=active]:text-indigo-600 data-[state=active]:dark:text-indigo-400 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:dark:border-indigo-400 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-none data-[state=active]:shadow-none bg-transparent"
          >
            Multipliers
          </TabsTrigger>
          <TabsTrigger 
            value="special" 
            className="px-4 py-2 data-[state=active]:text-indigo-600 data-[state=active]:dark:text-indigo-400 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:dark:border-indigo-400 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-none data-[state=active]:shadow-none bg-transparent"
          >
            Special
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="autoTapper" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredUpgrades.map(upgrade => (
              <UpgradeCard 
                key={upgrade.id}
                upgrade={upgrade}
                canAfford={score >= Math.floor(upgrade.cost * Math.pow(1.15, upgrade.count))}
                onPurchase={() => purchaseUpgrade(upgrade.id)}
              />
            ))}
            
            {filteredUpgrades.length === 0 && (
              <Card className="col-span-2">
                <CardContent className="pt-6 text-center text-gray-500 dark:text-gray-400">
                  No {selectedUpgradeType} upgrades available yet
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="multiplier" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredUpgrades.map(upgrade => (
              <UpgradeCard 
                key={upgrade.id}
                upgrade={upgrade}
                canAfford={score >= Math.floor(upgrade.cost * Math.pow(1.15, upgrade.count))}
                onPurchase={() => purchaseUpgrade(upgrade.id)}
              />
            ))}
            
            {filteredUpgrades.length === 0 && (
              <Card className="col-span-2">
                <CardContent className="pt-6 text-center text-gray-500 dark:text-gray-400">
                  No multiplier upgrades available yet
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="special" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredUpgrades.map(upgrade => (
              <UpgradeCard 
                key={upgrade.id}
                upgrade={upgrade}
                canAfford={score >= Math.floor(upgrade.cost * Math.pow(1.15, upgrade.count))}
                onPurchase={() => purchaseUpgrade(upgrade.id)}
              />
            ))}
            
            {filteredUpgrades.length === 0 && (
              <Card className="col-span-2">
                <CardContent className="pt-6 text-center text-gray-500 dark:text-gray-400">
                  No special upgrades available yet
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}

interface UpgradeCardProps {
  upgrade: UpgradeItem;
  canAfford: boolean;
  onPurchase: () => void;
}

function UpgradeCard({ upgrade, canAfford, onPurchase }: UpgradeCardProps) {
  // Calculate the actual cost based on how many you already have
  const actualCost = Math.floor(upgrade.cost * Math.pow(1.15, upgrade.count));
  
  return (
    <Card 
      className={`border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition cursor-pointer ${!canAfford ? 'opacity-70' : ''}`}
      onClick={() => canAfford && onPurchase()}
    >
      <CardContent className="p-4">
        <div className="flex items-start">
          <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded mr-3">
            <i className={`${upgrade.icon} text-xl text-indigo-600 dark:text-indigo-400`}></i>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-800 dark:text-gray-200">{upgrade.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{upgrade.description}</p>
            <div className="flex justify-between items-center">
              <span className="font-mono text-amber-600 dark:text-amber-400">
                Cost: {actualCost.toLocaleString()}
              </span>
              <span className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono">
                {upgrade.count}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
