import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  uuid: { input: string; output: string; }
};

/** Boolean expression to compare columns of type "String". All fields are combined with logical 'AND'. */
export type String_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['String']['input']>;
  _gt?: InputMaybe<Scalars['String']['input']>;
  _gte?: InputMaybe<Scalars['String']['input']>;
  /** does the column match the given case-insensitive pattern */
  _ilike?: InputMaybe<Scalars['String']['input']>;
  _in?: InputMaybe<Array<Scalars['String']['input']>>;
  /** does the column match the given POSIX regular expression, case insensitive */
  _iregex?: InputMaybe<Scalars['String']['input']>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  /** does the column match the given pattern */
  _like?: InputMaybe<Scalars['String']['input']>;
  _lt?: InputMaybe<Scalars['String']['input']>;
  _lte?: InputMaybe<Scalars['String']['input']>;
  _neq?: InputMaybe<Scalars['String']['input']>;
  /** does the column NOT match the given case-insensitive pattern */
  _nilike?: InputMaybe<Scalars['String']['input']>;
  _nin?: InputMaybe<Array<Scalars['String']['input']>>;
  /** does the column NOT match the given POSIX regular expression, case insensitive */
  _niregex?: InputMaybe<Scalars['String']['input']>;
  /** does the column NOT match the given pattern */
  _nlike?: InputMaybe<Scalars['String']['input']>;
  /** does the column NOT match the given POSIX regular expression, case sensitive */
  _nregex?: InputMaybe<Scalars['String']['input']>;
  /** does the column NOT match the given SQL regular expression */
  _nsimilar?: InputMaybe<Scalars['String']['input']>;
  /** does the column match the given POSIX regular expression, case sensitive */
  _regex?: InputMaybe<Scalars['String']['input']>;
  /** does the column match the given SQL regular expression */
  _similar?: InputMaybe<Scalars['String']['input']>;
};

/** ordering argument of a cursor */
export enum Cursor_Ordering {
  /** ascending ordering of the cursor */
  Asc = 'ASC',
  /** descending ordering of the cursor */
  Desc = 'DESC'
}

/** mutation root */
export type Mutation_Root = {
  __typename?: 'mutation_root';
  /** delete data from the table: "user" */
  delete_user?: Maybe<User_Mutation_Response>;
  /** delete single row from the table: "user" */
  delete_user_by_pk?: Maybe<User>;
  /** insert data into the table: "user" */
  insert_user?: Maybe<User_Mutation_Response>;
  /** insert a single row into the table: "user" */
  insert_user_one?: Maybe<User>;
  /** update data of the table: "user" */
  update_user?: Maybe<User_Mutation_Response>;
  /** update single row of the table: "user" */
  update_user_by_pk?: Maybe<User>;
  /** update multiples rows of table: "user" */
  update_user_many?: Maybe<Array<Maybe<User_Mutation_Response>>>;
};


/** mutation root */
export type Mutation_RootDelete_UserArgs = {
  where: User_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_User_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


/** mutation root */
export type Mutation_RootInsert_UserArgs = {
  objects: Array<User_Insert_Input>;
  on_conflict?: InputMaybe<User_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_User_OneArgs = {
  object: User_Insert_Input;
  on_conflict?: InputMaybe<User_On_Conflict>;
};


/** mutation root */
export type Mutation_RootUpdate_UserArgs = {
  _set?: InputMaybe<User_Set_Input>;
  where: User_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_User_By_PkArgs = {
  _set?: InputMaybe<User_Set_Input>;
  pk_columns: User_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_User_ManyArgs = {
  updates: Array<User_Updates>;
};

/** column ordering options */
export enum Order_By {
  /** in ascending order, nulls last */
  Asc = 'asc',
  /** in ascending order, nulls first */
  AscNullsFirst = 'asc_nulls_first',
  /** in ascending order, nulls last */
  AscNullsLast = 'asc_nulls_last',
  /** in descending order, nulls first */
  Desc = 'desc',
  /** in descending order, nulls first */
  DescNullsFirst = 'desc_nulls_first',
  /** in descending order, nulls last */
  DescNullsLast = 'desc_nulls_last'
}

export type Query_Root = {
  __typename?: 'query_root';
  /** fetch data from the table: "user" */
  user: Array<User>;
  /** fetch aggregated fields from the table: "user" */
  user_aggregate: User_Aggregate;
  /** fetch data from the table: "user" using primary key columns */
  user_by_pk?: Maybe<User>;
};


export type Query_RootUserArgs = {
  distinct_on?: InputMaybe<Array<User_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<User_Order_By>>;
  where?: InputMaybe<User_Bool_Exp>;
};


export type Query_RootUser_AggregateArgs = {
  distinct_on?: InputMaybe<Array<User_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<User_Order_By>>;
  where?: InputMaybe<User_Bool_Exp>;
};


export type Query_RootUser_By_PkArgs = {
  id: Scalars['uuid']['input'];
};

export type Subscription_Root = {
  __typename?: 'subscription_root';
  /** fetch data from the table: "user" */
  user: Array<User>;
  /** fetch aggregated fields from the table: "user" */
  user_aggregate: User_Aggregate;
  /** fetch data from the table: "user" using primary key columns */
  user_by_pk?: Maybe<User>;
  /** fetch data from the table in a streaming manner: "user" */
  user_stream: Array<User>;
};


export type Subscription_RootUserArgs = {
  distinct_on?: InputMaybe<Array<User_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<User_Order_By>>;
  where?: InputMaybe<User_Bool_Exp>;
};


export type Subscription_RootUser_AggregateArgs = {
  distinct_on?: InputMaybe<Array<User_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<User_Order_By>>;
  where?: InputMaybe<User_Bool_Exp>;
};


export type Subscription_RootUser_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Subscription_RootUser_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<User_Stream_Cursor_Input>>;
  where?: InputMaybe<User_Bool_Exp>;
};

/** columns and relationships of "user" */
export type User = {
  __typename?: 'user';
  discord_avatar?: Maybe<Scalars['String']['output']>;
  discord_name?: Maybe<Scalars['String']['output']>;
  discord_user_id?: Maybe<Scalars['String']['output']>;
  id: Scalars['uuid']['output'];
  poe_name?: Maybe<Scalars['String']['output']>;
  poe_user_id?: Maybe<Scalars['String']['output']>;
};

/** aggregated selection of "user" */
export type User_Aggregate = {
  __typename?: 'user_aggregate';
  aggregate?: Maybe<User_Aggregate_Fields>;
  nodes: Array<User>;
};

/** aggregate fields of "user" */
export type User_Aggregate_Fields = {
  __typename?: 'user_aggregate_fields';
  count: Scalars['Int']['output'];
  max?: Maybe<User_Max_Fields>;
  min?: Maybe<User_Min_Fields>;
};


/** aggregate fields of "user" */
export type User_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<User_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Boolean expression to filter rows from the table "user". All fields are combined with a logical 'AND'. */
export type User_Bool_Exp = {
  _and?: InputMaybe<Array<User_Bool_Exp>>;
  _not?: InputMaybe<User_Bool_Exp>;
  _or?: InputMaybe<Array<User_Bool_Exp>>;
  discord_avatar?: InputMaybe<String_Comparison_Exp>;
  discord_name?: InputMaybe<String_Comparison_Exp>;
  discord_user_id?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  poe_name?: InputMaybe<String_Comparison_Exp>;
  poe_user_id?: InputMaybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "user" */
export enum User_Constraint {
  /** unique or primary key constraint on columns "discord_user_id" */
  UserDiscordUserIdKey = 'user_discord_user_id_key',
  /** unique or primary key constraint on columns "id" */
  UserPkey = 'user_pkey',
  /** unique or primary key constraint on columns "poe_user_id" */
  UserPoeUserIdKey = 'user_poe_user_id_key'
}

/** input type for inserting data into table "user" */
export type User_Insert_Input = {
  discord_avatar?: InputMaybe<Scalars['String']['input']>;
  discord_name?: InputMaybe<Scalars['String']['input']>;
  discord_user_id?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  poe_name?: InputMaybe<Scalars['String']['input']>;
  poe_user_id?: InputMaybe<Scalars['String']['input']>;
};

/** aggregate max on columns */
export type User_Max_Fields = {
  __typename?: 'user_max_fields';
  discord_avatar?: Maybe<Scalars['String']['output']>;
  discord_name?: Maybe<Scalars['String']['output']>;
  discord_user_id?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  poe_name?: Maybe<Scalars['String']['output']>;
  poe_user_id?: Maybe<Scalars['String']['output']>;
};

/** aggregate min on columns */
export type User_Min_Fields = {
  __typename?: 'user_min_fields';
  discord_avatar?: Maybe<Scalars['String']['output']>;
  discord_name?: Maybe<Scalars['String']['output']>;
  discord_user_id?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  poe_name?: Maybe<Scalars['String']['output']>;
  poe_user_id?: Maybe<Scalars['String']['output']>;
};

/** response of any mutation on the table "user" */
export type User_Mutation_Response = {
  __typename?: 'user_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int']['output'];
  /** data from the rows affected by the mutation */
  returning: Array<User>;
};

/** on_conflict condition type for table "user" */
export type User_On_Conflict = {
  constraint: User_Constraint;
  update_columns?: Array<User_Update_Column>;
  where?: InputMaybe<User_Bool_Exp>;
};

/** Ordering options when selecting data from "user". */
export type User_Order_By = {
  discord_avatar?: InputMaybe<Order_By>;
  discord_name?: InputMaybe<Order_By>;
  discord_user_id?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  poe_name?: InputMaybe<Order_By>;
  poe_user_id?: InputMaybe<Order_By>;
};

/** primary key columns input for table: user */
export type User_Pk_Columns_Input = {
  id: Scalars['uuid']['input'];
};

/** select columns of table "user" */
export enum User_Select_Column {
  /** column name */
  DiscordAvatar = 'discord_avatar',
  /** column name */
  DiscordName = 'discord_name',
  /** column name */
  DiscordUserId = 'discord_user_id',
  /** column name */
  Id = 'id',
  /** column name */
  PoeName = 'poe_name',
  /** column name */
  PoeUserId = 'poe_user_id'
}

/** input type for updating data in table "user" */
export type User_Set_Input = {
  discord_avatar?: InputMaybe<Scalars['String']['input']>;
  discord_name?: InputMaybe<Scalars['String']['input']>;
  discord_user_id?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  poe_name?: InputMaybe<Scalars['String']['input']>;
  poe_user_id?: InputMaybe<Scalars['String']['input']>;
};

/** Streaming cursor of the table "user" */
export type User_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: User_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type User_Stream_Cursor_Value_Input = {
  discord_avatar?: InputMaybe<Scalars['String']['input']>;
  discord_name?: InputMaybe<Scalars['String']['input']>;
  discord_user_id?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  poe_name?: InputMaybe<Scalars['String']['input']>;
  poe_user_id?: InputMaybe<Scalars['String']['input']>;
};

/** update columns of table "user" */
export enum User_Update_Column {
  /** column name */
  DiscordAvatar = 'discord_avatar',
  /** column name */
  DiscordName = 'discord_name',
  /** column name */
  DiscordUserId = 'discord_user_id',
  /** column name */
  Id = 'id',
  /** column name */
  PoeName = 'poe_name',
  /** column name */
  PoeUserId = 'poe_user_id'
}

export type User_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<User_Set_Input>;
  /** filter the rows which have to be updated */
  where: User_Bool_Exp;
};

/** Boolean expression to compare columns of type "uuid". All fields are combined with logical 'AND'. */
export type Uuid_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['uuid']['input']>;
  _gt?: InputMaybe<Scalars['uuid']['input']>;
  _gte?: InputMaybe<Scalars['uuid']['input']>;
  _in?: InputMaybe<Array<Scalars['uuid']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['uuid']['input']>;
  _lte?: InputMaybe<Scalars['uuid']['input']>;
  _neq?: InputMaybe<Scalars['uuid']['input']>;
  _nin?: InputMaybe<Array<Scalars['uuid']['input']>>;
};

export type UserFieldsFragment = { __typename?: 'user', id: string, poe_name?: string | null, poe_user_id?: string | null, discord_name?: string | null, discord_avatar?: string | null, discord_user_id?: string | null };

export type UsersQueryVariables = Exact<{ [key: string]: never; }>;


export type UsersQuery = { __typename?: 'query_root', user: Array<{ __typename?: 'user', id: string, poe_name?: string | null, poe_user_id?: string | null, discord_name?: string | null, discord_avatar?: string | null, discord_user_id?: string | null }> };

export type UsersSubSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type UsersSubSubscription = { __typename?: 'subscription_root', user: Array<{ __typename?: 'user', id: string, poe_name?: string | null, poe_user_id?: string | null, discord_name?: string | null, discord_avatar?: string | null, discord_user_id?: string | null }> };

export const UserFieldsFragmentDoc = gql`
    fragment UserFields on user {
  id
  poe_name
  poe_user_id
  discord_name
  discord_avatar
  discord_user_id
}
    `;
export const UsersDocument = gql`
    query Users {
  user {
    ...UserFields
  }
}
    ${UserFieldsFragmentDoc}`;
export type UsersQueryResult = Apollo.QueryResult<UsersQuery, UsersQueryVariables>;
export const UsersSubDocument = gql`
    subscription UsersSub {
  user {
    ...UserFields
  }
}
    ${UserFieldsFragmentDoc}`;
export type UsersSubSubscriptionResult = Apollo.SubscriptionResult<UsersSubSubscription>;

      export interface PossibleTypesResultData {
        possibleTypes: {
          [key: string]: string[]
        }
      }
      const result: PossibleTypesResultData = {
  "possibleTypes": {}
};
      export default result;
    