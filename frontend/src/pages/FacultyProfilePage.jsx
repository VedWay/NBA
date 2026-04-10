import { useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useFacultyProfile } from "../hooks/useFaculty";
import FacultyProfile from "../components/FacultyProfile";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { entryApi, facultyApi } from "../api/facultyApi";

export default function FacultyProfilePage() {
  const { id } = useParams();
  const { token, role, user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const { data, isLoading, error } = useFacultyProfile(id, token);

  const isOwnerById = Boolean(data?.faculty?.user_id && user?.id && data.faculty.user_id === user.id);
  const isOwnerByEmail = Boolean(
    data?.faculty?.email &&
      user?.email &&
      data.faculty.email.toLowerCase().trim() === user.email.toLowerCase().trim(),
  );

  const canManage = Boolean(token && role !== "viewer" && data?.faculty && (role === "admin" || isOwnerById || isOwnerByEmail));

  const createEntry = useMutation({
    mutationFn: ({ table, body }) => entryApi.create(table, { ...body, faculty_id: id }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty", id] });
      queryClient.invalidateQueries({ queryKey: ["faculty"] });
      setMessage("Saved successfully. Entry is pending admin approval.");
    },
    onError: (err) => setMessage(err.message || "Unable to save entry."),
  });

  const updateEntry = useMutation({
    mutationFn: ({ table, rowId, body }) => entryApi.update(table, rowId, body, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty", id] });
      setMessage("Updated successfully. Changes are pending admin approval.");
    },
    onError: (err) => setMessage(err.message || "Unable to update entry."),
  });

  const updateFaculty = useMutation({
    mutationFn: (body) => facultyApi.update(id, body, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty", id] });
      queryClient.invalidateQueries({ queryKey: ["faculty"] });
      setMessage("Profile updated. It will be visible to viewers after admin approval.");
    },
    onError: (err) => setMessage(err.message || "Unable to update profile."),
  });

  const handleCreateEntry = async (table, body) => {
    if (!canManage) return;
    await createEntry.mutateAsync({ table, body });
  };

  const handleUpdateFaculty = async (body) => {
    if (!canManage) return;
    await updateFaculty.mutateAsync(body);
  };

  const handleUpdateEntry = async (table, rowId, body) => {
    if (!canManage) return;
    await updateEntry.mutateAsync({ table, rowId, body });
  };

  const handleUploadPhoto = async (imageBase64, fileName) => {
    if (!canManage) return;
    const response = await facultyApi.uploadPhoto(id, { image_base64: imageBase64, file_name: fileName }, token);
    queryClient.invalidateQueries({ queryKey: ["faculty", id] });
    queryClient.invalidateQueries({ queryKey: ["faculty"] });
    setMessage(response?.photo_url ? "Photo uploaded successfully." : "Photo updated.");
  };

  if (isLoading) return <p className="px-4 py-10">Loading profile...</p>;
  if (error) return <p className="px-4 py-10 text-rose-600">{error.message}</p>;

  return (
    <DashboardLayout>
      <FacultyProfile
        data={data}
        canManage={canManage}
        onCreateEntry={handleCreateEntry}
        onUpdateEntry={handleUpdateEntry}
        onUpdateFaculty={handleUpdateFaculty}
        onUploadPhoto={handleUploadPhoto}
        message={message}
        busy={createEntry.isPending || updateEntry.isPending || updateFaculty.isPending}
      />
    </DashboardLayout>
  );
}
