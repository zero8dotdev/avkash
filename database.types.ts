export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ActivityLog: {
        Row: {
          changedBy: string | null
          changedColumns: Json | null
          changedOn: string | null
          createdBy: string | null
          createdOn: string | null
          id: number
          keyword: string | null
          orgId: string | null
          tableName: string | null
          teamId: string | null
          updatedBy: string | null
          updatedOn: string | null
          userId: string | null
        }
        Insert: {
          changedBy?: string | null
          changedColumns?: Json | null
          changedOn?: string | null
          createdBy?: string | null
          createdOn?: string | null
          id?: number
          keyword?: string | null
          orgId?: string | null
          tableName?: string | null
          teamId?: string | null
          updatedBy?: string | null
          updatedOn?: string | null
          userId?: string | null
        }
        Update: {
          changedBy?: string | null
          changedColumns?: Json | null
          changedOn?: string | null
          createdBy?: string | null
          createdOn?: string | null
          id?: number
          keyword?: string | null
          orgId?: string | null
          tableName?: string | null
          teamId?: string | null
          updatedBy?: string | null
          updatedOn?: string | null
          userId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_activity_org"
            columns: ["orgId"]
            isOneToOne: false
            referencedRelation: "Organisation"
            referencedColumns: ["orgId"]
          },
          {
            foreignKeyName: "fk_activity_team"
            columns: ["teamId"]
            isOneToOne: false
            referencedRelation: "Team"
            referencedColumns: ["teamId"]
          },
          {
            foreignKeyName: "fk_activity_user"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["userId"]
          },
        ]
      }
      ContactEmail: {
        Row: {
          email: string | null
          firstName: string | null
          id: string
          lastName: string | null
          message: string | null
        }
        Insert: {
          email?: string | null
          firstName?: string | null
          id?: string
          lastName?: string | null
          message?: string | null
        }
        Update: {
          email?: string | null
          firstName?: string | null
          id?: string
          lastName?: string | null
          message?: string | null
        }
        Relationships: []
      }
      Holiday: {
        Row: {
          createdBy: string | null
          createdOn: string | null
          date: string
          holidayId: string
          isCustom: boolean
          isRecurring: boolean
          location: string | null
          name: string
          orgId: string
          updatedBy: string | null
          updatedOn: string | null
        }
        Insert: {
          createdBy?: string | null
          createdOn?: string | null
          date: string
          holidayId?: string
          isCustom?: boolean
          isRecurring?: boolean
          location?: string | null
          name: string
          orgId: string
          updatedBy?: string | null
          updatedOn?: string | null
        }
        Update: {
          createdBy?: string | null
          createdOn?: string | null
          date?: string
          holidayId?: string
          isCustom?: boolean
          isRecurring?: boolean
          location?: string | null
          name?: string
          orgId?: string
          updatedBy?: string | null
          updatedOn?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_holiday_org"
            columns: ["orgId"]
            isOneToOne: false
            referencedRelation: "Organisation"
            referencedColumns: ["orgId"]
          },
        ]
      }
      Leave: {
        Row: {
          createdBy: string | null
          createdOn: string | null
          duration: Database["public"]["Enums"]["LeaveDuration"]
          endDate: string
          isApproved: Database["public"]["Enums"]["LeaveStatus"]
          leaveId: string
          leaveTypeId: string
          managerComment: string | null
          orgId: string
          reason: string | null
          shift: Database["public"]["Enums"]["Shift"]
          startDate: string
          teamId: string
          updatedBy: string | null
          updatedOn: string | null
          userId: string
        }
        Insert: {
          createdBy?: string | null
          createdOn?: string | null
          duration?: Database["public"]["Enums"]["LeaveDuration"]
          endDate: string
          isApproved?: Database["public"]["Enums"]["LeaveStatus"]
          leaveId?: string
          leaveTypeId: string
          managerComment?: string | null
          orgId: string
          reason?: string | null
          shift?: Database["public"]["Enums"]["Shift"]
          startDate: string
          teamId: string
          updatedBy?: string | null
          updatedOn?: string | null
          userId: string
        }
        Update: {
          createdBy?: string | null
          createdOn?: string | null
          duration?: Database["public"]["Enums"]["LeaveDuration"]
          endDate?: string
          isApproved?: Database["public"]["Enums"]["LeaveStatus"]
          leaveId?: string
          leaveTypeId?: string
          managerComment?: string | null
          orgId?: string
          reason?: string | null
          shift?: Database["public"]["Enums"]["Shift"]
          startDate?: string
          teamId?: string
          updatedBy?: string | null
          updatedOn?: string | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_leave_leavetype"
            columns: ["leaveTypeId"]
            isOneToOne: false
            referencedRelation: "LeaveType"
            referencedColumns: ["leaveTypeId"]
          },
          {
            foreignKeyName: "fk_leave_org"
            columns: ["orgId"]
            isOneToOne: false
            referencedRelation: "Organisation"
            referencedColumns: ["orgId"]
          },
          {
            foreignKeyName: "fk_leave_team"
            columns: ["teamId"]
            isOneToOne: false
            referencedRelation: "Team"
            referencedColumns: ["teamId"]
          },
          {
            foreignKeyName: "fk_leave_user"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["userId"]
          },
        ]
      }
      LeavePolicy: {
        Row: {
          accrualFrequency:
            | Database["public"]["Enums"]["AccuralFrequencyOptions"]
            | null
          accruals: boolean
          accrueOn: Database["public"]["Enums"]["AccrueOnOptions"] | null
          autoApprove: boolean
          createdBy: string | null
          createdOn: string | null
          isActive: boolean
          leavePolicyId: string
          leaveTypeId: string
          maxLeaves: number | null
          rollOver: boolean
          rollOverExpiry: string | null
          rollOverLimit: number | null
          teamId: string
          unlimited: boolean
          updatedBy: string | null
          updatedOn: string | null
        }
        Insert: {
          accrualFrequency?:
            | Database["public"]["Enums"]["AccuralFrequencyOptions"]
            | null
          accruals?: boolean
          accrueOn?: Database["public"]["Enums"]["AccrueOnOptions"] | null
          autoApprove?: boolean
          createdBy?: string | null
          createdOn?: string | null
          isActive?: boolean
          leavePolicyId?: string
          leaveTypeId: string
          maxLeaves?: number | null
          rollOver?: boolean
          rollOverExpiry?: string | null
          rollOverLimit?: number | null
          teamId: string
          unlimited?: boolean
          updatedBy?: string | null
          updatedOn?: string | null
        }
        Update: {
          accrualFrequency?:
            | Database["public"]["Enums"]["AccuralFrequencyOptions"]
            | null
          accruals?: boolean
          accrueOn?: Database["public"]["Enums"]["AccrueOnOptions"] | null
          autoApprove?: boolean
          createdBy?: string | null
          createdOn?: string | null
          isActive?: boolean
          leavePolicyId?: string
          leaveTypeId?: string
          maxLeaves?: number | null
          rollOver?: boolean
          rollOverExpiry?: string | null
          rollOverLimit?: number | null
          teamId?: string
          unlimited?: boolean
          updatedBy?: string | null
          updatedOn?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_leavepolicy_leavetype"
            columns: ["leaveTypeId"]
            isOneToOne: false
            referencedRelation: "LeaveType"
            referencedColumns: ["leaveTypeId"]
          },
          {
            foreignKeyName: "fk_leavepolicy_team"
            columns: ["teamId"]
            isOneToOne: false
            referencedRelation: "Team"
            referencedColumns: ["teamId"]
          },
        ]
      }
      LeaveType: {
        Row: {
          color: string | null
          createdBy: string | null
          createdOn: string | null
          emoji: string | null
          isActive: boolean
          leaveTypeId: string
          name: string
          orgId: string
          setSlackStatus: boolean
          statusMsg: string | null
          updatedBy: string | null
          updatedOn: string | null
        }
        Insert: {
          color?: string | null
          createdBy?: string | null
          createdOn?: string | null
          emoji?: string | null
          isActive?: boolean
          leaveTypeId?: string
          name: string
          orgId: string
          setSlackStatus?: boolean
          statusMsg?: string | null
          updatedBy?: string | null
          updatedOn?: string | null
        }
        Update: {
          color?: string | null
          createdBy?: string | null
          createdOn?: string | null
          emoji?: string | null
          isActive?: boolean
          leaveTypeId?: string
          name?: string
          orgId?: string
          setSlackStatus?: boolean
          statusMsg?: string | null
          updatedBy?: string | null
          updatedOn?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_leavetype_org"
            columns: ["orgId"]
            isOneToOne: false
            referencedRelation: "Organisation"
            referencedColumns: ["orgId"]
          },
        ]
      }
      OrgAccessData: {
        Row: {
          createdBy: string | null
          createdOn: string | null
          googleAccessToken: string | null
          googleRefreshToken: string | null
          id: string
          orgId: string | null
          ownerSlackId: string | null
          slackAccessToken: string | null
          slackRefreshToken: string | null
          updatedBy: string | null
          updatedOn: string | null
        }
        Insert: {
          createdBy?: string | null
          createdOn?: string | null
          googleAccessToken?: string | null
          googleRefreshToken?: string | null
          id?: string
          orgId?: string | null
          ownerSlackId?: string | null
          slackAccessToken?: string | null
          slackRefreshToken?: string | null
          updatedBy?: string | null
          updatedOn?: string | null
        }
        Update: {
          createdBy?: string | null
          createdOn?: string | null
          googleAccessToken?: string | null
          googleRefreshToken?: string | null
          id?: string
          orgId?: string | null
          ownerSlackId?: string | null
          slackAccessToken?: string | null
          slackRefreshToken?: string | null
          updatedBy?: string | null
          updatedOn?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_orgaccessdata_org"
            columns: ["orgId"]
            isOneToOne: false
            referencedRelation: "Organisation"
            referencedColumns: ["orgId"]
          },
        ]
      }
      Organisation: {
        Row: {
          createdBy: string | null
          createdOn: string | null
          dateformat: string
          halfDayLeave: boolean
          initialSetup: string | null
          isSetupCompleted: boolean | null
          location: string[] | null
          orgId: string
          ownerId: string | null
          subscriptionId: string | null
          timeformat: string
          updatedBy: string | null
          updatedOn: string | null
          visibility: Database["public"]["Enums"]["Visibility"]
        }
        Insert: {
          createdBy?: string | null
          createdOn?: string | null
          dateformat?: string
          halfDayLeave?: boolean
          initialSetup?: string | null
          isSetupCompleted?: boolean | null
          location?: string[] | null
          orgId?: string
          ownerId?: string | null
          subscriptionId?: string | null
          timeformat?: string
          updatedBy?: string | null
          updatedOn?: string | null
          visibility?: Database["public"]["Enums"]["Visibility"]
        }
        Update: {
          createdBy?: string | null
          createdOn?: string | null
          dateformat?: string
          halfDayLeave?: boolean
          initialSetup?: string | null
          isSetupCompleted?: boolean | null
          location?: string[] | null
          orgId?: string
          ownerId?: string | null
          subscriptionId?: string | null
          timeformat?: string
          updatedBy?: string | null
          updatedOn?: string | null
          visibility?: Database["public"]["Enums"]["Visibility"]
        }
        Relationships: []
      }
      PaySubMap: {
        Row: {
          id: string
          razorpayPaymentId: string | null
          razorpaySignature: string | null
          razorpaySubscriptionId: string | null
        }
        Insert: {
          id?: string
          razorpayPaymentId?: string | null
          razorpaySignature?: string | null
          razorpaySubscriptionId?: string | null
        }
        Update: {
          id?: string
          razorpayPaymentId?: string | null
          razorpaySignature?: string | null
          razorpaySubscriptionId?: string | null
        }
        Relationships: []
      }
      PublicHolidays: {
        Row: {
          country: string | null
          date: string | null
          day: string | null
          id: string
          iso: string | null
          name: string | null
          type: string | null
          year: number | null
        }
        Insert: {
          country?: string | null
          date?: string | null
          day?: string | null
          id?: string
          iso?: string | null
          name?: string | null
          type?: string | null
          year?: number | null
        }
        Update: {
          country?: string | null
          date?: string | null
          day?: string | null
          id?: string
          iso?: string | null
          name?: string | null
          type?: string | null
          year?: number | null
        }
        Relationships: []
      }
      Subscription: {
        Row: {
          authAttempts: number | null
          chargeAt: number | null
          createdAt: number | null
          currentEnd: number | null
          currentStart: number | null
          customerId: string | null
          customerNotify: boolean | null
          endAt: number | null
          endedAt: number | null
          entity: string | null
          expireBy: number | null
          hasScheduledChanges: boolean | null
          id: string
          note: string | null
          offerId: string | null
          paidCount: number | null
          planId: string | null
          quantity: number | null
          remainingCount: number | null
          scheduleChangeAt: number | null
          shortUrl: string | null
          startAt: number | null
          status: string | null
          totalCount: number | null
        }
        Insert: {
          authAttempts?: number | null
          chargeAt?: number | null
          createdAt?: number | null
          currentEnd?: number | null
          currentStart?: number | null
          customerId?: string | null
          customerNotify?: boolean | null
          endAt?: number | null
          endedAt?: number | null
          entity?: string | null
          expireBy?: number | null
          hasScheduledChanges?: boolean | null
          id: string
          note?: string | null
          offerId?: string | null
          paidCount?: number | null
          planId?: string | null
          quantity?: number | null
          remainingCount?: number | null
          scheduleChangeAt?: number | null
          shortUrl?: string | null
          startAt?: number | null
          status?: string | null
          totalCount?: number | null
        }
        Update: {
          authAttempts?: number | null
          chargeAt?: number | null
          createdAt?: number | null
          currentEnd?: number | null
          currentStart?: number | null
          customerId?: string | null
          customerNotify?: boolean | null
          endAt?: number | null
          endedAt?: number | null
          entity?: string | null
          expireBy?: number | null
          hasScheduledChanges?: boolean | null
          id?: string
          note?: string | null
          offerId?: string | null
          paidCount?: number | null
          planId?: string | null
          quantity?: number | null
          remainingCount?: number | null
          scheduleChangeAt?: number | null
          shortUrl?: string | null
          startAt?: number | null
          status?: string | null
          totalCount?: number | null
        }
        Relationships: []
      }
      Team: {
        Row: {
          createdBy: string | null
          createdOn: string | null
          isActive: boolean
          location: string | null
          managers: string[] | null
          name: string
          notificationDailySummary: boolean
          notificationDailySummarySendOnTime: string | null
          notificationLeaveChanged: boolean
          notificationToWhom: Database["public"]["Enums"]["Role"][]
          notificationWeeklySummary: boolean
          notificationWeeklySummarySendOnDay:
            | Database["public"]["Enums"]["DaysOfWeek"]
            | null
          notificationWeeklySummaryTime: string | null
          orgId: string
          startOfWorkWeek: Database["public"]["Enums"]["DaysOfWeek"] | null
          teamId: string
          timeZone: string | null
          updatedBy: string | null
          updatedOn: string | null
          workweek: Database["public"]["Enums"]["DaysOfWeek"][] | null
        }
        Insert: {
          createdBy?: string | null
          createdOn?: string | null
          isActive?: boolean
          location?: string | null
          managers?: string[] | null
          name: string
          notificationDailySummary?: boolean
          notificationDailySummarySendOnTime?: string | null
          notificationLeaveChanged?: boolean
          notificationToWhom?: Database["public"]["Enums"]["Role"][]
          notificationWeeklySummary?: boolean
          notificationWeeklySummarySendOnDay?:
            | Database["public"]["Enums"]["DaysOfWeek"]
            | null
          notificationWeeklySummaryTime?: string | null
          orgId: string
          startOfWorkWeek?: Database["public"]["Enums"]["DaysOfWeek"] | null
          teamId?: string
          timeZone?: string | null
          updatedBy?: string | null
          updatedOn?: string | null
          workweek?: Database["public"]["Enums"]["DaysOfWeek"][] | null
        }
        Update: {
          createdBy?: string | null
          createdOn?: string | null
          isActive?: boolean
          location?: string | null
          managers?: string[] | null
          name?: string
          notificationDailySummary?: boolean
          notificationDailySummarySendOnTime?: string | null
          notificationLeaveChanged?: boolean
          notificationToWhom?: Database["public"]["Enums"]["Role"][]
          notificationWeeklySummary?: boolean
          notificationWeeklySummarySendOnDay?:
            | Database["public"]["Enums"]["DaysOfWeek"]
            | null
          notificationWeeklySummaryTime?: string | null
          orgId?: string
          startOfWorkWeek?: Database["public"]["Enums"]["DaysOfWeek"] | null
          teamId?: string
          timeZone?: string | null
          updatedBy?: string | null
          updatedOn?: string | null
          workweek?: Database["public"]["Enums"]["DaysOfWeek"][] | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_team_org"
            columns: ["orgId"]
            isOneToOne: false
            referencedRelation: "Organisation"
            referencedColumns: ["orgId"]
          },
        ]
      }
      test_policy: {
        Row: {
          id: number
          policy_number: string | null
        }
        Insert: {
          id?: number
          policy_number?: string | null
        }
        Update: {
          id?: number
          policy_number?: string | null
        }
        Relationships: []
      }
      User: {
        Row: {
          accruedLeave: Json | null
          createdBy: string | null
          createdOn: string | null
          email: string
          googleId: string | null
          keyword: string | null
          name: string
          orgId: string | null
          overrides: Json | null
          picture: string | null
          role: Database["public"]["Enums"]["Role"]
          slackId: string | null
          teamId: string | null
          updatedBy: string | null
          updatedOn: string | null
          usedLeave: Json | null
          userId: string
        }
        Insert: {
          accruedLeave?: Json | null
          createdBy?: string | null
          createdOn?: string | null
          email: string
          googleId?: string | null
          keyword?: string | null
          name: string
          orgId?: string | null
          overrides?: Json | null
          picture?: string | null
          role?: Database["public"]["Enums"]["Role"]
          slackId?: string | null
          teamId?: string | null
          updatedBy?: string | null
          updatedOn?: string | null
          usedLeave?: Json | null
          userId?: string
        }
        Update: {
          accruedLeave?: Json | null
          createdBy?: string | null
          createdOn?: string | null
          email?: string
          googleId?: string | null
          keyword?: string | null
          name?: string
          orgId?: string | null
          overrides?: Json | null
          picture?: string | null
          role?: Database["public"]["Enums"]["Role"]
          slackId?: string | null
          teamId?: string | null
          updatedBy?: string | null
          updatedOn?: string | null
          usedLeave?: Json | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_org"
            columns: ["orgId"]
            isOneToOne: false
            referencedRelation: "Organisation"
            referencedColumns: ["orgId"]
          },
          {
            foreignKeyName: "fk_user_team"
            columns: ["teamId"]
            isOneToOne: false
            referencedRelation: "Team"
            referencedColumns: ["teamId"]
          },
        ]
      }
    }
    Views: {
      leave_summary: {
        Row: {
          count: number | null
          isApproved: Database["public"]["Enums"]["LeaveStatus"] | null
          leaveTypeId: string | null
          userId: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_leave_leavetype"
            columns: ["leaveTypeId"]
            isOneToOne: false
            referencedRelation: "LeaveType"
            referencedColumns: ["leaveTypeId"]
          },
          {
            foreignKeyName: "fk_leave_user"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["userId"]
          },
        ]
      }
    }
    Functions: {
      calculate_accruals: {
        Args: {
          frequency: string
        }
        Returns: undefined
      }
      fetch_user_orgid: {
        Args: {
          id: string
        }
        Returns: string
      }
      fetch_user_role: {
        Args: {
          id: string
        }
        Returns: string
      }
      fetch_user_teamid: {
        Args: {
          id: string
        }
        Returns: string
      }
      gtrgm_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_in: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_options: {
        Args: {
          "": unknown
        }
        Returns: undefined
      }
      gtrgm_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      set_limit: {
        Args: {
          "": number
        }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: {
          "": string
        }
        Returns: string[]
      }
    }
    Enums: {
      AccrueOnOptions: "BEGINNING" | "END"
      AccuralFrequencyOptions: "MONTHLY" | "QUARTERLY"
      DaysOfWeek:
        | "SUNDAY"
        | "MONDAY"
        | "TUESDAY"
        | "WEDNESDAY"
        | "THURSDAY"
        | "FRIDAY"
        | "SATURDAY"
      LeaveDuration: "FULL_DAY" | "HALF_DAY"
      LeaveStatus: "PENDING" | "APPROVED" | "REJECTED" | "DELETED"
      Role: "OWNER" | "MANAGER" | "USER" | "ANON" | "ADMIN"
      Shift: "MORNING" | "AFTERNOON" | "NONE"
      Visibility: "ORG" | "TEAM" | "SELF"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

