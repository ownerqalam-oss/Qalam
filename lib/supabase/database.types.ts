export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type PostRow = { id: string; author_id: string; title: string; tagline: string | null; content_html: string; type: string; tags: string[] | null; status: string; removed_from_status: string | null; created_at: string; updated_at: string; published_at: string | null };
type ProfileRow = { id: string; username: string | null; display_name: string | null; bio: string | null; avatar_path: string | null; onboarding_completed_at: string | null; suspended_at: string | null; suspended_by: string | null; follower_count: number; following_count: number; created_at: string; updated_at: string };
type InvitationRow = { id: string; inviter_id: string; email: string; status: string; invited_user_id: string | null; error_message: string | null; created_at: string; sent_at: string | null; accepted_at: string | null; updated_at: string };
type FollowRow = { follower_id: string; followed_id: string; created_at: string };
type SavedPostRow = { user_id: string; post_id: string; created_at: string };
type PostViewRow = { post_id: string; viewed_on: string; viewer_key: string; created_at: string };
type FollowerEventRow = { id: number; writer_id: string; delta: number; occurred_at: string };
type ReportRow = { id: string; reporter_id: string; target_type: string; post_id: string | null; profile_id: string | null; reason: string; details: string | null; status: string; created_at: string; updated_at: string };
type ModerationActionRow = { id: string; administrator_id: string; report_id: string | null; target_type: string; post_id: string | null; profile_id: string | null; action: string; reason: string; note: string | null; created_at: string };

export type Database = {
  public: {
    Tables: {
      posts: {
        Row: PostRow;
        Insert: Partial<Omit<PostRow, "author_id">> & Pick<PostRow, "author_id">;
        Update: Partial<PostRow>;
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: Partial<Omit<ProfileRow, "id">> & Pick<ProfileRow, "id">;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      invitations: {
        Row: InvitationRow;
        Insert: Partial<Omit<InvitationRow, "inviter_id" | "email">> & Pick<InvitationRow, "inviter_id" | "email">;
        Update: Partial<InvitationRow>;
        Relationships: [];
      };
      follows: {
        Row: FollowRow;
        Insert: FollowRow;
        Update: Partial<FollowRow>;
        Relationships: [];
      };
      saved_posts: {
        Row: SavedPostRow;
        Insert: SavedPostRow;
        Update: Partial<SavedPostRow>;
        Relationships: [];
      };
      post_views: {
        Row: PostViewRow;
        Insert: Omit<PostViewRow, "created_at"> & { created_at?: string };
        Update: Partial<PostViewRow>;
        Relationships: [];
      };
      follower_events: {
        Row: FollowerEventRow;
        Insert: Omit<FollowerEventRow, "id" | "occurred_at"> & { id?: never; occurred_at?: string };
        Update: Partial<FollowerEventRow>;
        Relationships: [];
      };
      reports: {
        Row: ReportRow;
        Insert: Partial<Omit<ReportRow, "reporter_id" | "target_type" | "reason">> & Pick<ReportRow, "reporter_id" | "target_type" | "reason">;
        Update: Partial<ReportRow>;
        Relationships: [];
      };
      moderation_actions: {
        Row: ModerationActionRow;
        Insert: Partial<Omit<ModerationActionRow, "administrator_id" | "target_type" | "action" | "reason">> & Pick<ModerationActionRow, "administrator_id" | "target_type" | "action" | "reason">;
        Update: Partial<ModerationActionRow>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_active_member: { Args: Record<PropertyKey, never>; Returns: boolean };
      set_profile_suspension: { Args: { target_user_id: string; should_suspend: boolean }; Returns: undefined };
      save_post: { Args: { post_id: string | null; post_title: string; post_tagline: string | null; post_content_html: string; post_type: string; post_tags: string[]; expected_updated_at?: string | null }; Returns: PostRow };
      publish_post: { Args: { post_id: string }; Returns: undefined };
      unpublish_post: { Args: { post_id: string }; Returns: undefined };
      delete_draft: { Args: { post_id: string }; Returns: undefined };
      follow_writer: { Args: { writer_id: string }; Returns: undefined };
      unfollow_writer: { Args: { writer_id: string }; Returns: undefined };
      save_post_for_later: { Args: { target_post_id: string }; Returns: undefined };
      unsave_post_for_later: { Args: { target_post_id: string }; Returns: undefined };
      record_post_view: { Args: { target_post_id: string; derived_viewer_key: string }; Returns: boolean };
      get_author_dashboard_analytics: { Args: Record<PropertyKey, never>; Returns: Json };
      submit_report: { Args: { target_kind: string; target_id: string; report_reason: string; report_details?: string | null }; Returns: string };
      set_report_review_state: { Args: { target_report_id: string; next_status: string; action_note?: string | null }; Returns: undefined };
      moderate_post: { Args: { target_post_id: string; should_remove: boolean; action_reason: string; action_note?: string | null; source_report_id?: string | null }; Returns: undefined };
      moderate_profile: { Args: { target_profile_id: string; should_suspend: boolean; action_reason: string; action_note?: string | null; source_report_id?: string | null }; Returns: undefined };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
