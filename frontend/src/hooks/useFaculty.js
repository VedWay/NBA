import { useQuery } from "@tanstack/react-query";
import { facultyApi } from "../api/facultyApi";

export function useFacultyList(token) {
  return useQuery({
    queryKey: ["faculty"],
    queryFn: () => facultyApi.list(token),
  });
}

export function useFacultyProfile(id, token) {
  return useQuery({
    queryKey: ["faculty", id],
    queryFn: () => facultyApi.byId(id, token),
    enabled: Boolean(id),
  });
}
