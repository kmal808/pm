import { useState, useRef } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

function priorityVariant(
  p: string,
): "destructive" | "warning" | "success" {
  if (p === "High") return "destructive";
  if (p === "Medium") return "warning";
  return "success";
}

export function Dashboard() {
  const [activeTab, setActiveTab] = useState("spaces");
  const [currentSpaceId, setCurrentSpaceId] = useState<Id<"spaces"> | null>(null);
  const [showNewSpace, setShowNewSpace] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [editingSpace, setEditingSpace] = useState<Id<"spaces"> | null>(null);
  const [editingProject, setEditingProject] = useState<Id<"projects"> | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<Id<"projects"> | null>(null);
  
  const spaces = useQuery(api.spaces.list);
  const projects = useQuery(
    api.projects.list,
    currentSpaceId ? { spaceId: currentSpaceId } : "skip"
  );
  const tasks = useQuery(
    api.tasks.listAssigned,
    currentSpaceId ? { spaceId: currentSpaceId } : "skip"
  );
  const projectTasks = useQuery(
    api.tasks.listByProject,
    selectedProjectId ? { projectId: selectedProjectId } : "skip"
  );
  const documents = useQuery(
    api.documents.list,
    currentSpaceId ? { 
      spaceId: currentSpaceId,
      projectId: selectedProjectId || undefined 
    } : "skip"
  );
  
  const createSpace = useMutation(api.spaces.create);
  const updateSpace = useMutation(api.spaces.update);
  const deleteSpace = useMutation(api.spaces.remove);
  
  const createProject = useMutation(api.projects.create);
  const updateProject = useMutation(api.projects.update);
  const deleteProject = useMutation(api.projects.remove);
  
  const createTask = useMutation(api.tasks.create);
  const updateTask = useMutation(api.tasks.update);
  const deleteTask = useMutation(api.tasks.remove);

  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const createDocument = useMutation(api.documents.create);
  const deleteDocument = useMutation(api.documents.remove);
  const convertToPdf = useAction(api.documents.convertToPdf);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-select first space if none selected
  if (!currentSpaceId && spaces && spaces.length > 0) {
    setCurrentSpaceId(spaces[0]._id);
  }

  const currentSpace = spaces?.find(s => s._id === currentSpaceId);

  const tabIds = ["spaces", "projects", "tasks", "documents"] as const;
  const tabLabel: Record<(typeof tabIds)[number], string> = {
    spaces: "Spaces",
    projects: "Projects",
    tasks: "Tasks",
    documents: "Documents",
  };

  return (
    <div className="mx-auto w-full max-w-[1536px] px-4 py-8 md:px-8 lg:px-10">
      {/* Space Selector */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Workspace
            </h1>
            {currentSpace && (
              <p className="text-sm text-muted-foreground">
                {currentSpace.name}
              </p>
            )}
          </div>
          <Button onClick={() => setShowNewSpace(true)}>New space</Button>
        </div>

        {spaces && spaces.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {spaces.map((space) => (
              <Button
                key={space._id}
                type="button"
                variant={currentSpaceId === space._id ? "default" : "secondary"}
                size="sm"
                className="shrink-0 rounded-full"
                onClick={() => {
                  setCurrentSpaceId(space._id);
                  setActiveTab("projects");
                  setSelectedProjectId(null);
                }}
              >
                {space.name}
              </Button>
            ))}
          </div>
        )}
      </div>

      {!currentSpaceId ? (
        <Card className="mx-auto max-w-md border-dashed">
          <CardHeader className="text-center">
            <CardTitle className="text-lg">No spaces yet</CardTitle>
            <CardDescription>
              Create a space to organize projects, tasks, and files.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center pb-6">
            <Button onClick={() => setShowNewSpace(true)}>
              Create your first space
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <>
          {/* Navigation Tabs */}
          <div className="mb-8 flex flex-wrap gap-2">
            <div
              className="inline-flex h-10 items-center rounded-lg bg-muted/80 p-1 text-muted-foreground ring-1 ring-border/60"
              role="tablist"
            >
              {tabIds.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab}
                  className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                    activeTab === tab
                      ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                      : "hover:text-foreground",
                  )}
                  onClick={() => setActiveTab(tab)}
                >
                  {tabLabel[tab]}
                </button>
              ))}
            </div>
          </div>

          {/* Spaces Tab */}
          {activeTab === "spaces" && (
            <div className="space-y-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-semibold tracking-tight">Spaces</h2>
                <Button onClick={() => setShowNewSpace(true)}>New space</Button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {spaces?.map((space) => (
                  <Card key={space._id} className="flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 space-y-1">
                          <CardTitle className="text-base">{space.name}</CardTitle>
                          <CardDescription className="line-clamp-3">
                            {space.description}
                          </CardDescription>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={() => setEditingSpace(space._id)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                            onClick={async () => {
                              try {
                                await deleteSpace({ id: space._id });
                                if (currentSpaceId === space._id) {
                                  setCurrentSpaceId(null);
                                }
                                toast.success("Space deleted");
                              } catch (error) {
                                toast.error("Failed to delete space");
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardFooter className="mt-auto border-t border-border/80 pt-4">
                      <Button
                        variant="link"
                        className="h-auto p-0 text-primary"
                        onClick={() => {
                          setCurrentSpaceId(space._id);
                          setActiveTab("projects");
                        }}
                      >
                        Open space →
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Projects Tab */}
          {activeTab === "projects" && (
            <div className="space-y-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-semibold tracking-tight">Projects</h2>
                <Button onClick={() => setShowNewProject(true)}>
                  New project
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {projects?.map((project) => (
                  <Card key={project._id} className="flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 space-y-1">
                          <CardTitle className="text-base">{project.name}</CardTitle>
                          <CardDescription className="line-clamp-3">
                            {project.description}
                          </CardDescription>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={() => setEditingProject(project._id)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                            onClick={async () => {
                              try {
                                await deleteProject({ id: project._id });
                                toast.success("Project deleted");
                              } catch (error) {
                                toast.error("Failed to delete project");
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pb-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span className="tabular-nums text-foreground">
                            {project.progress}%
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-foreground/80 transition-all"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <Badge variant={priorityVariant(project.priority)}>
                          {project.priority}
                        </Badge>
                        <span className="text-muted-foreground">
                          Due{" "}
                          {new Date(project.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter className="mt-auto border-t border-border/80 pt-4">
                      <Button
                        variant="link"
                        className="h-auto p-0 text-primary"
                        onClick={() => {
                          setSelectedProjectId(project._id);
                          setActiveTab("tasks");
                        }}
                      >
                        View tasks ({project.taskCount || 0}) →
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === "tasks" && (
            <div className="space-y-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-semibold tracking-tight">
                  {selectedProjectId
                    ? `Tasks — ${
                        projects?.find((p) => p._id === selectedProjectId)?.name
                      }`
                    : "All tasks"}
                </h2>
                <Button onClick={() => setShowNewTask(true)}>New task</Button>
              </div>

              <div className="space-y-3">
                {(selectedProjectId ? projectTasks : tasks)?.map((task) => (
                  <Card
                    key={task._id}
                    className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className="font-medium leading-none">{task.name}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Badge variant={priorityVariant(task.priority)}>
                          {task.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Due {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        variant={
                          task.status === "Completed" ? "secondary" : "outline"
                        }
                        size="sm"
                        onClick={async () => {
                          try {
                            await updateTask({
                              id: task._id,
                              status:
                                task.status === "Completed"
                                  ? "In Progress"
                                  : "Completed",
                            });
                            toast.success("Task updated");
                          } catch (error) {
                            toast.error("Failed to update task");
                          }
                        }}
                      >
                        {task.status}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={async () => {
                          try {
                            await deleteTask({ id: task._id });
                            toast.success("Task deleted");
                          } catch (error) {
                            toast.error("Failed to delete task");
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === "documents" && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">
                    Documents
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Uploads apply to the current space
                    {selectedProjectId ? " and selected project" : ""}.
                  </p>
                </div>
                <div>
                  <input
                    id="file-upload"
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !currentSpaceId) return;

                      try {
                        // Get a pre-signed URL for the upload
                        const uploadUrl = await generateUploadUrl();

                        // Upload the file
                        const result = await fetch(uploadUrl, {
                          method: "POST",
                          headers: { "Content-Type": file.type },
                          body: file,
                        });

                        if (!result.ok) {
                          throw new Error(`Upload failed: ${result.statusText}`);
                        }

                        const { storageId } = await result.json();

                        // Create the document record
                        await createDocument({
                          storageId,
                          name: file.name,
                          type: file.type,
                          size: file.size,
                          projectId: selectedProjectId || undefined,
                          spaceId: currentSpaceId,
                        });

                        toast.success("File uploaded successfully");
                      } catch (error) {
                        toast.error("Failed to upload file");
                        console.error(error);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload file
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {documents?.map((document) => (
                  <Card key={document._id} className="flex flex-col gap-3 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-lg">
                        {document.type.includes("pdf")
                          ? "📄"
                          : document.type.includes("image")
                            ? "🖼️"
                            : "📁"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4
                          className="truncate font-medium leading-tight"
                          title={document.name}
                        >
                          {document.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {(document.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
                      <div className="flex flex-wrap gap-1">
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto px-0 py-0 text-xs"
                          onClick={() => {
                            if (document.url) {
                              window.open(document.url, "_blank");
                            }
                          }}
                        >
                          View
                        </Button>
                        {(document.type.includes("jpeg") ||
                          document.type.includes("jpg") ||
                          document.type.includes("png")) && (
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto px-0 py-0 text-xs text-emerald-600 dark:text-emerald-400"
                            onClick={async () => {
                              try {
                                if (currentSpaceId) {
                                  await convertToPdf({
                                    documentId: document._id,
                                    spaceId: currentSpaceId,
                                  });
                                  toast.success("Converting to PDF...");
                                }
                              } catch (error) {
                                toast.error("Failed to convert to PDF");
                              }
                            }}
                          >
                            To PDF
                          </Button>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                        onClick={async () => {
                          try {
                            await deleteDocument({ id: document._id });
                            toast.success("Document deleted");
                          } catch (error) {
                            toast.error("Failed to delete document");
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {new Date(document.uploadedAt).toLocaleDateString()}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Space Creation Modal */}
      {showNewSpace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close"
            className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={() => setShowNewSpace(false)}
          />
          <Card className="relative z-10 w-full max-w-md shadow-lg">
            <CardHeader>
              <CardTitle>New space</CardTitle>
              <CardDescription>
                A space groups related projects and documents.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                id="new-space-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const formData = new FormData(form);

                  try {
                    const spaceId = await createSpace({
                      name: formData.get("name") as string,
                      description: formData.get("description") as string,
                    });
                    setCurrentSpaceId(spaceId);
                    setShowNewSpace(false);
                    setActiveTab("projects");
                    toast.success("Space created");
                  } catch (error) {
                    toast.error("Failed to create space");
                  }
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="new-space-name">Name</Label>
                  <Input
                    id="new-space-name"
                    type="text"
                    name="name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-space-desc">Description</Label>
                  <Textarea
                    id="new-space-desc"
                    name="description"
                    required
                  />
                </div>
              </form>
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewSpace(false)}
              >
                Cancel
              </Button>
              <Button type="submit" form="new-space-form">
                Create
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Space Edit Modal */}
      {editingSpace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close"
            className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={() => setEditingSpace(null)}
          />
          <Card className="relative z-10 w-full max-w-md shadow-lg">
            <CardHeader>
              <CardTitle>Edit space</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                id="edit-space-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const formData = new FormData(form);

                  try {
                    await updateSpace({
                      id: editingSpace,
                      name: formData.get("name") as string,
                      description: formData.get("description") as string,
                    });
                    setEditingSpace(null);
                    toast.success("Space updated");
                  } catch (error) {
                    toast.error("Failed to update space");
                  }
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="edit-space-name">Name</Label>
                  <Input
                    id="edit-space-name"
                    type="text"
                    name="name"
                    defaultValue={
                      spaces?.find((s) => s._id === editingSpace)?.name
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-space-desc">Description</Label>
                  <Textarea
                    id="edit-space-desc"
                    name="description"
                    defaultValue={
                      spaces?.find((s) => s._id === editingSpace)?.description
                    }
                    required
                  />
                </div>
              </form>
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingSpace(null)}
              >
                Cancel
              </Button>
              <Button type="submit" form="edit-space-form">
                Update
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Project Creation Modal */}
      {showNewProject && currentSpaceId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close"
            className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={() => setShowNewProject(false)}
          />
          <Card className="relative z-10 w-full max-w-md shadow-lg">
            <CardHeader>
              <CardTitle>New project</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                id="new-project-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const formData = new FormData(form);

                  try {
                    await createProject({
                      name: formData.get("name") as string,
                      description: formData.get("description") as string,
                      priority: formData.get("priority") as string,
                      dueDate: new Date(
                        formData.get("dueDate") as string,
                      ).getTime(),
                      spaceId: currentSpaceId,
                    });
                    setShowNewProject(false);
                    toast.success("Project created");
                  } catch (error) {
                    toast.error("Failed to create project");
                  }
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="new-project-name">Name</Label>
                  <Input id="new-project-name" type="text" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-project-desc">Description</Label>
                  <Textarea
                    id="new-project-desc"
                    name="description"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-project-priority">Priority</Label>
                  <Select id="new-project-priority" name="priority" required>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-project-due">Due date</Label>
                  <Input
                    id="new-project-due"
                    type="date"
                    name="dueDate"
                    required
                  />
                </div>
              </form>
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewProject(false)}
              >
                Cancel
              </Button>
              <Button type="submit" form="new-project-form">
                Create
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Task Creation Modal */}
      {showNewTask && currentSpaceId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close"
            className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={() => setShowNewTask(false)}
          />
          <Card className="relative z-10 w-full max-w-md shadow-lg">
            <CardHeader>
              <CardTitle>New task</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                id="new-task-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const formData = new FormData(form);

                  try {
                    const projectId = formData.get("projectId") as string;
                    await createTask({
                      name: formData.get("name") as string,
                      description: formData.get("description") as string,
                      priority: formData.get("priority") as string,
                      projectId: projectId
                        ? (projectId as Id<"projects">)
                        : undefined,
                      status: "Not Started",
                      dueDate: new Date(
                        formData.get("dueDate") as string,
                      ).getTime(),
                      spaceId: currentSpaceId,
                    });
                    setShowNewTask(false);
                    toast.success("Task created");
                  } catch (error) {
                    toast.error("Failed to create task");
                  }
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="new-task-name">Name</Label>
                  <Input id="new-task-name" type="text" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-task-desc">Description</Label>
                  <Textarea
                    id="new-task-desc"
                    name="description"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-task-project">Project</Label>
                  <Select id="new-task-project" name="projectId">
                    <option value="">No project</option>
                    {projects?.map((project) => (
                      <option key={project._id} value={project._id}>
                        {project.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-task-priority">Priority</Label>
                  <Select id="new-task-priority" name="priority" required>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-task-due">Due date</Label>
                  <Input
                    id="new-task-due"
                    type="date"
                    name="dueDate"
                    required
                  />
                </div>
              </form>
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewTask(false)}
              >
                Cancel
              </Button>
              <Button type="submit" form="new-task-form">
                Create
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Project Edit Modal */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close"
            className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={() => setEditingProject(null)}
          />
          <Card className="relative z-10 max-h-[min(90vh,720px)] w-full max-w-md overflow-y-auto shadow-lg">
            <CardHeader>
              <CardTitle>Edit project</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                id="edit-project-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const formData = new FormData(form);

                  try {
                    await updateProject({
                      id: editingProject,
                      name: formData.get("name") as string,
                      description: formData.get("description") as string,
                      priority: formData.get("priority") as string,
                      status: formData.get("status") as string,
                      progress: Number(formData.get("progress")),
                      dueDate: new Date(
                        formData.get("dueDate") as string,
                      ).getTime(),
                    });
                    setEditingProject(null);
                    toast.success("Project updated");
                  } catch (error) {
                    toast.error("Failed to update project");
                  }
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="edit-project-name">Name</Label>
                  <Input
                    id="edit-project-name"
                    type="text"
                    name="name"
                    defaultValue={
                      projects?.find((p) => p._id === editingProject)?.name
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-project-desc">Description</Label>
                  <Textarea
                    id="edit-project-desc"
                    name="description"
                    defaultValue={
                      projects?.find((p) => p._id === editingProject)
                        ?.description
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-project-priority">Priority</Label>
                  <Select
                    id="edit-project-priority"
                    name="priority"
                    defaultValue={
                      projects?.find((p) => p._id === editingProject)
                        ?.priority
                    }
                    required
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-project-status">Status</Label>
                  <Select
                    id="edit-project-status"
                    name="status"
                    defaultValue={
                      projects?.find((p) => p._id === editingProject)?.status
                    }
                    required
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-project-progress">Progress</Label>
                  <Input
                    id="edit-project-progress"
                    type="number"
                    name="progress"
                    min={0}
                    max={100}
                    defaultValue={
                      projects?.find((p) => p._id === editingProject)?.progress
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-project-due">Due date</Label>
                  <Input
                    id="edit-project-due"
                    type="date"
                    name="dueDate"
                    defaultValue={new Date(
                      projects?.find((p) => p._id === editingProject)
                        ?.dueDate || 0,
                    )
                      .toISOString()
                      .split("T")[0]}
                    required
                  />
                </div>
              </form>
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingProject(null)}
              >
                Cancel
              </Button>
              <Button type="submit" form="edit-project-form">
                Update
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
