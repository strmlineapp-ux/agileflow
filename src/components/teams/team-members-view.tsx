

'use client';

import { useUser } from '@/context/user-context';
import { type Team } from '@/types';
import { TeamMemberCard } from './team-member-card';
import { LocationCheckManagerManagement } from './location-check-manager-management';

export function TeamMembersView({ team }: { team: Team }) {
    const { users } = useUser();
    
    const teamMembers = users.filter(u => team.members.includes(u.userId));

    return (
        <div className="space-y-6">
            <LocationCheckManagerManagement team={team} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teamMembers.map(member => (
                    <TeamMemberCard key={member.userId} member={member} team={team} />
                ))}
            </div>
        </div>
    );
}
