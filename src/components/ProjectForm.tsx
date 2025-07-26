
import ProjectFormContainer from './forms/ProjectFormContainer';

interface ProjectFormProps {
  editProject?: any;
  onSave?: () => void;
  autoFillData?: any;
}

const ProjectForm = ({ editProject, onSave, autoFillData }: ProjectFormProps) => {
  return (
    <ProjectFormContainer 
      editProject={editProject}
      onSave={onSave}
      autoFillData={autoFillData}
    />
  );
};

export default ProjectForm;
