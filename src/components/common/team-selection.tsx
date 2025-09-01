
'use client';

import React from 'react';
import { type Team } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { GoogleSymbol } from '../icons/google-symbol';

interface TeamSelectionProps {
  teams: Team[];
  onSelectTeam: (team: Team) => void;
  message?: string;
}

export function TeamSelection({ teams, onSelectTeam, message = "Select a team to continue" }: TeamSelectionProps) {
  return (
    <Card className="flex-1">
      <CardContent className="p-4 h-full flex flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4">{message}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {teams.map(team => (
            <div
              key={team.id}
              onClick={() => onSelectTeam(team)}
              className="group flex flex-col items-center justify-center gap-2 p-4 rounded-lg cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <GoogleSymbol name={team.icon} style={{ color: team.color }} className="text-5xl" weight={100}/>
              <p className="text-sm font-medium text-center break-words">{team.name}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

