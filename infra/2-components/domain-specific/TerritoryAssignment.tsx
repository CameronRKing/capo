'use client';

import React, { useState, useMemo, useRef } from 'react';
import { ModelContextProvider, Types } from '@/domain';
import resumes from '@/1-models/constants/resumes';
import counties from '@/1-models/constants/counties';
import countyNetworks from '@/1-models/constants/countyNetworks';
import { Flx } from '@/2-components/design-system/Flx';
import { ListBox } from 'primereact/listbox';
import { Toast } from 'primereact/toast';

type RepDoc = Types['active_reps']['Doc'];

interface TerritoryAssignmentProps {
  currentTeam: RepDoc[];
}

export default function TerritoryAssignment({ currentTeam }: TerritoryAssignmentProps) {
  const [selectedRepId, setSelectedRepId] = useState<string | null>(null);
  const [hoveredCounty, setHoveredCounty] = useState<{ id: number; x: number; y: number } | null>(null);
  const toast = useRef<Toast>(null);

  // Check if a county can be assigned to a rep (must be adjacent to existing territories)
  const canAssignCounty = (countyId: number, repId: string): boolean => {
    const territorySet = repTerritorySetMap.get(repId);

    // If rep has no territories, any county is valid
    if (!territorySet || territorySet.size === 0) return true;

    // If rep already has this county, it's valid (for unassign)
    if (territorySet.has(countyId)) return true;

    // Check if the new county is adjacent to any existing territory
    const adjacentCounties = countyNetworks[countyId] || [];
    return adjacentCounties.some(adjacentId => territorySet.has(adjacentId));
  };

  // Memoized Maps for O(1) lookups
  const repMap = useMemo(() =>
    new Map(currentTeam.map(rep => [rep.id, rep])),
    [currentTeam]
  );

  const repIndexMap = useMemo(() =>
    new Map(currentTeam.map((rep, index) => [rep.id, index])),
    [currentTeam]
  );

  // Map: repId -> Set of countyIds (for efficient territory operations)
  const repTerritorySetMap = useMemo(() => {
    const map = new Map<string, Set<number>>();
    for (const rep of currentTeam) {
      map.set(rep.id, new Set(rep.territories || []));
    }
    return map;
  }, [currentTeam]);

  // Map: countyId -> repId (reverse lookup)
  const countyToRepMap = useMemo(() => {
    const map = new Map<number, string | null>();
    for (const [repId, territorySet] of repTerritorySetMap) {
      for (const countyId of territorySet) {
        map.set(countyId, repId);
      }
    }
    return map;
  }, [repTerritorySetMap]);

  const repShopCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const [repId, territorySet] of repTerritorySetMap) {
      let count = 0;
      for (const countyId of territorySet) {
        const county = counties[countyId];
        if (county) {
          count += Math.ceil(parseInt(county.population) / 20000);
        }
      }
      map.set(repId, count);
    }
    return map;
  }, [repTerritorySetMap]);

  const countyShopCountMap = useMemo(() => {
    const map = new Map<number, number>();
    for (const [id, county] of Object.entries(counties)) {
      map.set(Number(id), Math.ceil(parseInt(county.population) / 20000));
    }
    return map;
  }, []);

  const assignedCountyIds = useMemo(() => {
    return new Set(Array.from(countyToRepMap.keys()));
  }, [countyToRepMap]);

  const unassignedCountyIds = useMemo(() => {
    return Object.keys(counties)
      .map(Number)
      .filter(countyId => !assignedCountyIds.has(countyId));
  }, [assignedCountyIds]);

  const unassignedShopCount = useMemo(() => {
    return unassignedCountyIds.reduce((total, countyId) => {
      const county = counties[countyId];
      return total + (county ? Math.ceil(parseInt(county.population) / 20000) : 0);
    }, 0);
  }, [unassignedCountyIds]);

  // Territory assignment colors for each rep
  const getTerritoryColor = (repId: string | null) => {
    if (repId === null) return '#f5f5f4';
    const repIndex = repIndexMap.get(repId);
    if (repIndex === undefined) return '#f5f5f4';
    const colors = ['#93c5fd', '#86efac', '#fca5a5', '#fcd34d', '#c4b5fd', '#f9a8d4'];
    return colors[repIndex % colors.length];
  };

  // Handle county click - assign to selected rep or unassign if "Unassigned" is selected
  const handleCountyClick = async (countyId: number) => {
    // If "Unassigned" is selected, find the rep that currently owns this county and unassign it
    if (selectedRepId === null) {
      const owningRepId = countyToRepMap.get(countyId);
      if (owningRepId) {
        const rep = repMap.get(owningRepId);
        if (rep) {
          const territorySet = repTerritorySetMap.get(owningRepId)!;
          const newTerritories = Array.from(new Set([...territorySet].filter(id => id !== countyId)));
          await rep.patch({ territories: newTerritories });
        }
      }
      return;
    }

    const rep = repMap.get(selectedRepId);
    if (!rep) return;

    const territorySet = repTerritorySetMap.get(selectedRepId)!;
    const isCurrentlyAssigned = territorySet.has(countyId);

    if (isCurrentlyAssigned) {
      // Unassign from this rep
      const newTerritories = Array.from(new Set([...territorySet].filter(id => id !== countyId)));
      await rep.patch({ territories: newTerritories });
    } else {
      // Validate contiguity before assigning
      if (!canAssignCounty(countyId, selectedRepId)) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Cannot Assign County',
          detail: 'Counties must be connected - the new county must border an existing county in this territory.',
          life: 3000
        });
        return;
      }

      // Remove from other reps who own this county, then assign to this rep
      // Do both updates in parallel for speed
      const patches: Promise<void>[] = [];

      const owningRepId = countyToRepMap.get(countyId);
      if (owningRepId && owningRepId !== selectedRepId) {
        const otherRep = repMap.get(owningRepId);
        if (otherRep) {
          const otherTerritorySet = repTerritorySetMap.get(owningRepId)!;
          const newOtherTerritories = Array.from(new Set([...otherTerritorySet].filter(id => id !== countyId)));
          patches.push(otherRep.patch({ territories: newOtherTerritories }));
        }
      }

      const newTerritories = Array.from(new Set([...territorySet, countyId]));
      patches.push(rep.patch({ territories: newTerritories }));

      await Promise.all(patches);
    }
  };

  const repName = (rep: RepDoc) => resumes[rep.repId].name;

  // Create legend items for ListBox
  const legendItems = useMemo(() => [
    ...currentTeam.map(rep => ({ type: 'rep' as const, id: rep.id, rep })),
    { type: 'unassigned' as const, id: null }
  ], [currentTeam]);

  const legendItemMap = useMemo(() =>
    new Map(legendItems.map(item => [item.id, item])),
    [legendItems]
  );

  const selectedItem = legendItemMap.get(selectedRepId) ?? null;

  // Render individual legend item - KEEPING EXISTING MARKUP
  const legendItemTemplate = (item: { type: 'rep' | 'unassigned'; id: string | null; rep?: RepDoc }) => {
    const isRep = item.type === 'rep';
    const displayName = isRep ? repName(item.rep!) : 'Unassigned';
    const shopCount = isRep ? (repShopCountMap.get(item.rep!.id) ?? 0) : unassignedShopCount;

    return (
      <Flx dr g3 js aic cpp>
        {/* Color swatch */}
        <Flx
          w6 h6 brs bor1 fs0
          style={{ backgroundColor: getTerritoryColor(item.id) }}
        />
        {/* Name */}
        <Flx fzb fw={selectedRepId === item.id ? 'sb' : 'n'} as="span">
          {displayName}
        </Flx>
        {/* Shop count */}
        <Flx fzb cg6 mla as="span">
          {shopCount} shops
        </Flx>
      </Flx>
    );
  };

  return (
    <>
      <Toast ref={toast} />
      <Flx g4>
        <Flx fzs cg6 as="p">
          Assign Ohio counties to your sales reps. Click a county to assign/unassign it.
        </Flx>

      <Flx dr g6 js ais>
        {/* Legend - Vertical list on the left */}
        <Flx maxw={350} gg1>
          <ListBox
            value={selectedItem}
            options={legendItems}
            optionLabel="displayName"
            onChange={(e) => setSelectedRepId(e.value?.id ?? null)}
            itemTemplate={legendItemTemplate}
            style={{ border: 'none', background: 'transparent', padding: 0 }}
          />
        </Flx>

        {/* Map */}
        <Flx posr gg1 maxw={700}>
          <svg
            viewBox="0 0 520 420"
            style={{ width: '100%', height: 'auto', cursor: 'pointer' }}
            xmlns="http://www.w3.org/2000/svg"
            onMouseLeave={() => setHoveredCounty(null)}
          >
            {Object.values(counties).map(county => {
              const assignedRepId = countyToRepMap.get(county.id) ?? null;
              const shopCount = countyShopCountMap.get(county.id) ?? 0;

              return (
                <path
                  key={county.id}
                  d={county.path}
                  fill={getTerritoryColor(assignedRepId)}
                  stroke="#374151"
                  strokeWidth="1"
                  onClick={() => handleCountyClick(county.id)}
                  style={{ transition: 'opacity 0.15s ease', cursor: 'pointer' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.8';
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHoveredCounty({
                      id: county.id,
                      x: rect.left + rect.width / 2,
                      y: rect.top
                    });
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                  onMouseMove={(e) => {
                    if (hoveredCounty?.id === county.id) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoveredCounty({
                        id: county.id,
                        x: e.clientX,
                        y: rect.top
                      });
                    }
                  }}
                />
              );
            })}
          </svg>

          {/* Tooltip */}
          {hoveredCounty && (
            <div
              style={{
                position: 'fixed',
                left: hoveredCounty.x,
                top: hoveredCounty.y - 40,
                transform: 'translateX(-50%)',
                backgroundColor: '#1f2937',
                color: 'white',
                padding: '6px 10px',
                borderRadius: '4px',
                fontSize: '13px',
                pointerEvents: 'none',
                zIndex: 1000,
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
            >
              <strong>{counties[hoveredCounty.id]?.name}</strong>
              <span style={{ marginLeft: '8px', color: '#9ca3af' }}>
                {countyShopCountMap.get(hoveredCounty.id) ?? 0} shops
              </span>
            </div>
          )}
        </Flx>
      </Flx>

      {/* Validation messages */}
      {unassignedCountyIds.length > 0 && (
        <Flx fzs co as="p">
          {unassignedCountyIds.length} counties still unassigned
        </Flx>
      )}
      {currentTeam.some(rep => repTerritorySetMap.get(rep.id)?.size === 0) && (
        <Flx fzs cr as="p">
          Every rep must be assigned at least one county
        </Flx>
      )}
      </Flx>
    </>
  );
}
