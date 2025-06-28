
'use client';

import { useUser } from '@/context/user-context';
import { type Team } from '@/types';
import { TeamMemberCard } from './team-member-card';

export function TeamMembersView({ team }: { team: Team }) {
    const { users } = useUser();
    
    const teamMembers = users.filter(u => team.members.includes(u.userId));

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembers.map(member => (
                <TeamMemberCard key={member.userId} member={member} team={team} />
            ))}
        </div>
    );
}
