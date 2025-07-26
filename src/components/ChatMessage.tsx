
import { Bot, User } from 'lucide-react';
import { ProjectCard } from './ProjectCard';
import { ChatPagination } from './ChatPagination';

interface Project {
  project_id: string;
  project_title: string;
  developer_name: string;
  emirate: string;
  region_area: string;
  project_type: string;
  description: string;
  relevance_score: number;
  reasoning: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  searchResults?: {
    query: string;
    total: number;
    currentPage: number;
    totalPages: number;
    projects: Project[];
  };
}

interface ChatMessageProps {
  message: Message;
  onSaveProject: (project: Project) => void;
  onPagination: (direction: 'prev' | 'next') => void;
  isLoading: boolean;
}

export const ChatMessage = ({ message, onSaveProject, onPagination, isLoading }: ChatMessageProps) => {
  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-3xl rounded-lg p-4 ${
        message.role === 'user' 
          ? 'bg-blue-500 text-white' 
          : 'bg-white shadow-sm border'
      }`}>
        <div className="flex items-start space-x-2">
          {message.role === 'assistant' && <Bot className="w-5 h-5 mt-0.5 text-blue-500" />}
          {message.role === 'user' && <User className="w-5 h-5 mt-0.5" />}
          <div className="flex-1">
            <p className="text-sm">{message.content}</p>
            {message.searchResults && (
              <div className="mt-4 space-y-3">
                {message.searchResults.projects.map((project, projectIndex) => (
                  <ProjectCard
                    key={projectIndex}
                    project={project}
                    onSaveProject={onSaveProject}
                  />
                ))}
                
                <ChatPagination
                  currentPage={message.searchResults.currentPage}
                  totalPages={message.searchResults.totalPages}
                  isLoading={isLoading}
                  onPagination={onPagination}
                />
              </div>
            )}
          </div>
        </div>
        <p className="text-xs opacity-70 mt-2">
          {message.timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};
