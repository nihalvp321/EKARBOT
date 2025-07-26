
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ChatPaginationProps {
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  onPagination: (direction: 'prev' | 'next') => void;
}

export const ChatPagination = ({ currentPage, totalPages, isLoading, onPagination }: ChatPaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center space-x-4 mt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPagination('prev')}
        disabled={currentPage === 1 || isLoading}
        className="flex items-center space-x-1"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Previous</span>
      </Button>
      
      <span className="text-sm text-gray-600">
        Page {currentPage} of {totalPages}
      </span>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPagination('next')}
        disabled={currentPage === totalPages || isLoading}
        className="flex items-center space-x-1"
      >
        <span>Next</span>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
};
