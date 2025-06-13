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
  bigint: { input: any; output: any; }
  timestamptz: { input: string; output: string; }
  uuid: { input: string; output: string; }
};

/** Boolean expression to compare columns of type "Boolean". All fields are combined with logical 'AND'. */
export type Boolean_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['Boolean']['input']>;
  _gt?: InputMaybe<Scalars['Boolean']['input']>;
  _gte?: InputMaybe<Scalars['Boolean']['input']>;
  _in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['Boolean']['input']>;
  _lte?: InputMaybe<Scalars['Boolean']['input']>;
  _neq?: InputMaybe<Scalars['Boolean']['input']>;
  _nin?: InputMaybe<Array<Scalars['Boolean']['input']>>;
};

/** Boolean expression to compare columns of type "Int". All fields are combined with logical 'AND'. */
export type Int_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['Int']['input']>;
  _gt?: InputMaybe<Scalars['Int']['input']>;
  _gte?: InputMaybe<Scalars['Int']['input']>;
  _in?: InputMaybe<Array<Scalars['Int']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['Int']['input']>;
  _lte?: InputMaybe<Scalars['Int']['input']>;
  _neq?: InputMaybe<Scalars['Int']['input']>;
  _nin?: InputMaybe<Array<Scalars['Int']['input']>>;
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

/** Boolean expression to compare columns of type "bigint". All fields are combined with logical 'AND'. */
export type Bigint_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['bigint']['input']>;
  _gt?: InputMaybe<Scalars['bigint']['input']>;
  _gte?: InputMaybe<Scalars['bigint']['input']>;
  _in?: InputMaybe<Array<Scalars['bigint']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['bigint']['input']>;
  _lte?: InputMaybe<Scalars['bigint']['input']>;
  _neq?: InputMaybe<Scalars['bigint']['input']>;
  _nin?: InputMaybe<Array<Scalars['bigint']['input']>>;
};

/** columns and relationships of "character" */
export type Character = {
  __typename?: 'character';
  challenges: Scalars['Int']['output'];
  class: Scalars['String']['output'];
  dead: Scalars['Boolean']['output'];
  experience: Scalars['bigint']['output'];
  id: Scalars['String']['output'];
  league?: Maybe<Scalars['String']['output']>;
  level: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  poe_account_name: Scalars['String']['output'];
  rank: Scalars['Int']['output'];
  retired: Scalars['Boolean']['output'];
  twitch?: Maybe<Scalars['String']['output']>;
};

/** aggregated selection of "character" */
export type Character_Aggregate = {
  __typename?: 'character_aggregate';
  aggregate?: Maybe<Character_Aggregate_Fields>;
  nodes: Array<Character>;
};

/** aggregate fields of "character" */
export type Character_Aggregate_Fields = {
  __typename?: 'character_aggregate_fields';
  avg?: Maybe<Character_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Character_Max_Fields>;
  min?: Maybe<Character_Min_Fields>;
  stddev?: Maybe<Character_Stddev_Fields>;
  stddev_pop?: Maybe<Character_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Character_Stddev_Samp_Fields>;
  sum?: Maybe<Character_Sum_Fields>;
  var_pop?: Maybe<Character_Var_Pop_Fields>;
  var_samp?: Maybe<Character_Var_Samp_Fields>;
  variance?: Maybe<Character_Variance_Fields>;
};


/** aggregate fields of "character" */
export type Character_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Character_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** aggregate avg on columns */
export type Character_Avg_Fields = {
  __typename?: 'character_avg_fields';
  challenges?: Maybe<Scalars['Float']['output']>;
  experience?: Maybe<Scalars['Float']['output']>;
  level?: Maybe<Scalars['Float']['output']>;
  rank?: Maybe<Scalars['Float']['output']>;
};

/** Boolean expression to filter rows from the table "character". All fields are combined with a logical 'AND'. */
export type Character_Bool_Exp = {
  _and?: InputMaybe<Array<Character_Bool_Exp>>;
  _not?: InputMaybe<Character_Bool_Exp>;
  _or?: InputMaybe<Array<Character_Bool_Exp>>;
  challenges?: InputMaybe<Int_Comparison_Exp>;
  class?: InputMaybe<String_Comparison_Exp>;
  dead?: InputMaybe<Boolean_Comparison_Exp>;
  experience?: InputMaybe<Bigint_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  league?: InputMaybe<String_Comparison_Exp>;
  level?: InputMaybe<Int_Comparison_Exp>;
  name?: InputMaybe<String_Comparison_Exp>;
  poe_account_name?: InputMaybe<String_Comparison_Exp>;
  rank?: InputMaybe<Int_Comparison_Exp>;
  retired?: InputMaybe<Boolean_Comparison_Exp>;
  twitch?: InputMaybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "character" */
export enum Character_Constraint {
  /** unique or primary key constraint on columns "id" */
  CharacterPkey = 'character_pkey'
}

/** input type for incrementing numeric columns in table "character" */
export type Character_Inc_Input = {
  challenges?: InputMaybe<Scalars['Int']['input']>;
  experience?: InputMaybe<Scalars['bigint']['input']>;
  level?: InputMaybe<Scalars['Int']['input']>;
  rank?: InputMaybe<Scalars['Int']['input']>;
};

/** input type for inserting data into table "character" */
export type Character_Insert_Input = {
  challenges?: InputMaybe<Scalars['Int']['input']>;
  class?: InputMaybe<Scalars['String']['input']>;
  dead?: InputMaybe<Scalars['Boolean']['input']>;
  experience?: InputMaybe<Scalars['bigint']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  league?: InputMaybe<Scalars['String']['input']>;
  level?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  poe_account_name?: InputMaybe<Scalars['String']['input']>;
  rank?: InputMaybe<Scalars['Int']['input']>;
  retired?: InputMaybe<Scalars['Boolean']['input']>;
  twitch?: InputMaybe<Scalars['String']['input']>;
};

/** aggregate max on columns */
export type Character_Max_Fields = {
  __typename?: 'character_max_fields';
  challenges?: Maybe<Scalars['Int']['output']>;
  class?: Maybe<Scalars['String']['output']>;
  experience?: Maybe<Scalars['bigint']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  league?: Maybe<Scalars['String']['output']>;
  level?: Maybe<Scalars['Int']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  poe_account_name?: Maybe<Scalars['String']['output']>;
  rank?: Maybe<Scalars['Int']['output']>;
  twitch?: Maybe<Scalars['String']['output']>;
};

/** aggregate min on columns */
export type Character_Min_Fields = {
  __typename?: 'character_min_fields';
  challenges?: Maybe<Scalars['Int']['output']>;
  class?: Maybe<Scalars['String']['output']>;
  experience?: Maybe<Scalars['bigint']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  league?: Maybe<Scalars['String']['output']>;
  level?: Maybe<Scalars['Int']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  poe_account_name?: Maybe<Scalars['String']['output']>;
  rank?: Maybe<Scalars['Int']['output']>;
  twitch?: Maybe<Scalars['String']['output']>;
};

/** response of any mutation on the table "character" */
export type Character_Mutation_Response = {
  __typename?: 'character_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int']['output'];
  /** data from the rows affected by the mutation */
  returning: Array<Character>;
};

/** on_conflict condition type for table "character" */
export type Character_On_Conflict = {
  constraint: Character_Constraint;
  update_columns?: Array<Character_Update_Column>;
  where?: InputMaybe<Character_Bool_Exp>;
};

/** Ordering options when selecting data from "character". */
export type Character_Order_By = {
  challenges?: InputMaybe<Order_By>;
  class?: InputMaybe<Order_By>;
  dead?: InputMaybe<Order_By>;
  experience?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  league?: InputMaybe<Order_By>;
  level?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
  poe_account_name?: InputMaybe<Order_By>;
  rank?: InputMaybe<Order_By>;
  retired?: InputMaybe<Order_By>;
  twitch?: InputMaybe<Order_By>;
};

/** primary key columns input for table: character */
export type Character_Pk_Columns_Input = {
  id: Scalars['String']['input'];
};

/** select columns of table "character" */
export enum Character_Select_Column {
  /** column name */
  Challenges = 'challenges',
  /** column name */
  Class = 'class',
  /** column name */
  Dead = 'dead',
  /** column name */
  Experience = 'experience',
  /** column name */
  Id = 'id',
  /** column name */
  League = 'league',
  /** column name */
  Level = 'level',
  /** column name */
  Name = 'name',
  /** column name */
  PoeAccountName = 'poe_account_name',
  /** column name */
  Rank = 'rank',
  /** column name */
  Retired = 'retired',
  /** column name */
  Twitch = 'twitch'
}

/** input type for updating data in table "character" */
export type Character_Set_Input = {
  challenges?: InputMaybe<Scalars['Int']['input']>;
  class?: InputMaybe<Scalars['String']['input']>;
  dead?: InputMaybe<Scalars['Boolean']['input']>;
  experience?: InputMaybe<Scalars['bigint']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  league?: InputMaybe<Scalars['String']['input']>;
  level?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  poe_account_name?: InputMaybe<Scalars['String']['input']>;
  rank?: InputMaybe<Scalars['Int']['input']>;
  retired?: InputMaybe<Scalars['Boolean']['input']>;
  twitch?: InputMaybe<Scalars['String']['input']>;
};

/** aggregate stddev on columns */
export type Character_Stddev_Fields = {
  __typename?: 'character_stddev_fields';
  challenges?: Maybe<Scalars['Float']['output']>;
  experience?: Maybe<Scalars['Float']['output']>;
  level?: Maybe<Scalars['Float']['output']>;
  rank?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_pop on columns */
export type Character_Stddev_Pop_Fields = {
  __typename?: 'character_stddev_pop_fields';
  challenges?: Maybe<Scalars['Float']['output']>;
  experience?: Maybe<Scalars['Float']['output']>;
  level?: Maybe<Scalars['Float']['output']>;
  rank?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_samp on columns */
export type Character_Stddev_Samp_Fields = {
  __typename?: 'character_stddev_samp_fields';
  challenges?: Maybe<Scalars['Float']['output']>;
  experience?: Maybe<Scalars['Float']['output']>;
  level?: Maybe<Scalars['Float']['output']>;
  rank?: Maybe<Scalars['Float']['output']>;
};

/** Streaming cursor of the table "character" */
export type Character_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Character_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Character_Stream_Cursor_Value_Input = {
  challenges?: InputMaybe<Scalars['Int']['input']>;
  class?: InputMaybe<Scalars['String']['input']>;
  dead?: InputMaybe<Scalars['Boolean']['input']>;
  experience?: InputMaybe<Scalars['bigint']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  league?: InputMaybe<Scalars['String']['input']>;
  level?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  poe_account_name?: InputMaybe<Scalars['String']['input']>;
  rank?: InputMaybe<Scalars['Int']['input']>;
  retired?: InputMaybe<Scalars['Boolean']['input']>;
  twitch?: InputMaybe<Scalars['String']['input']>;
};

/** aggregate sum on columns */
export type Character_Sum_Fields = {
  __typename?: 'character_sum_fields';
  challenges?: Maybe<Scalars['Int']['output']>;
  experience?: Maybe<Scalars['bigint']['output']>;
  level?: Maybe<Scalars['Int']['output']>;
  rank?: Maybe<Scalars['Int']['output']>;
};

/** update columns of table "character" */
export enum Character_Update_Column {
  /** column name */
  Challenges = 'challenges',
  /** column name */
  Class = 'class',
  /** column name */
  Dead = 'dead',
  /** column name */
  Experience = 'experience',
  /** column name */
  Id = 'id',
  /** column name */
  League = 'league',
  /** column name */
  Level = 'level',
  /** column name */
  Name = 'name',
  /** column name */
  PoeAccountName = 'poe_account_name',
  /** column name */
  Rank = 'rank',
  /** column name */
  Retired = 'retired',
  /** column name */
  Twitch = 'twitch'
}

export type Character_Updates = {
  /** increments the numeric columns with given value of the filtered values */
  _inc?: InputMaybe<Character_Inc_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Character_Set_Input>;
  /** filter the rows which have to be updated */
  where: Character_Bool_Exp;
};

/** aggregate var_pop on columns */
export type Character_Var_Pop_Fields = {
  __typename?: 'character_var_pop_fields';
  challenges?: Maybe<Scalars['Float']['output']>;
  experience?: Maybe<Scalars['Float']['output']>;
  level?: Maybe<Scalars['Float']['output']>;
  rank?: Maybe<Scalars['Float']['output']>;
};

/** aggregate var_samp on columns */
export type Character_Var_Samp_Fields = {
  __typename?: 'character_var_samp_fields';
  challenges?: Maybe<Scalars['Float']['output']>;
  experience?: Maybe<Scalars['Float']['output']>;
  level?: Maybe<Scalars['Float']['output']>;
  rank?: Maybe<Scalars['Float']['output']>;
};

/** aggregate variance on columns */
export type Character_Variance_Fields = {
  __typename?: 'character_variance_fields';
  challenges?: Maybe<Scalars['Float']['output']>;
  experience?: Maybe<Scalars['Float']['output']>;
  level?: Maybe<Scalars['Float']['output']>;
  rank?: Maybe<Scalars['Float']['output']>;
};

/** ordering argument of a cursor */
export enum Cursor_Ordering {
  /** ascending ordering of the cursor */
  Asc = 'ASC',
  /** descending ordering of the cursor */
  Desc = 'DESC'
}

/** columns and relationships of "item_order_type" */
export type Item_Order_Type = {
  __typename?: 'item_order_type';
  value: Scalars['String']['output'];
};

/** aggregated selection of "item_order_type" */
export type Item_Order_Type_Aggregate = {
  __typename?: 'item_order_type_aggregate';
  aggregate?: Maybe<Item_Order_Type_Aggregate_Fields>;
  nodes: Array<Item_Order_Type>;
};

/** aggregate fields of "item_order_type" */
export type Item_Order_Type_Aggregate_Fields = {
  __typename?: 'item_order_type_aggregate_fields';
  count: Scalars['Int']['output'];
  max?: Maybe<Item_Order_Type_Max_Fields>;
  min?: Maybe<Item_Order_Type_Min_Fields>;
};


/** aggregate fields of "item_order_type" */
export type Item_Order_Type_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Item_Order_Type_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Boolean expression to filter rows from the table "item_order_type". All fields are combined with a logical 'AND'. */
export type Item_Order_Type_Bool_Exp = {
  _and?: InputMaybe<Array<Item_Order_Type_Bool_Exp>>;
  _not?: InputMaybe<Item_Order_Type_Bool_Exp>;
  _or?: InputMaybe<Array<Item_Order_Type_Bool_Exp>>;
  value?: InputMaybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "item_order_type" */
export enum Item_Order_Type_Constraint {
  /** unique or primary key constraint on columns "value" */
  ItemOrderTypePkey = 'item_order_type_pkey'
}

export enum Item_Order_Type_Enum {
  Base = 'base',
  Other = 'other',
  Transfiguredgem = 'transfiguredgem',
  Unique = 'unique'
}

/** Boolean expression to compare columns of type "item_order_type_enum". All fields are combined with logical 'AND'. */
export type Item_Order_Type_Enum_Comparison_Exp = {
  _eq?: InputMaybe<Item_Order_Type_Enum>;
  _in?: InputMaybe<Array<Item_Order_Type_Enum>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _neq?: InputMaybe<Item_Order_Type_Enum>;
  _nin?: InputMaybe<Array<Item_Order_Type_Enum>>;
};

/** input type for inserting data into table "item_order_type" */
export type Item_Order_Type_Insert_Input = {
  value?: InputMaybe<Scalars['String']['input']>;
};

/** aggregate max on columns */
export type Item_Order_Type_Max_Fields = {
  __typename?: 'item_order_type_max_fields';
  value?: Maybe<Scalars['String']['output']>;
};

/** aggregate min on columns */
export type Item_Order_Type_Min_Fields = {
  __typename?: 'item_order_type_min_fields';
  value?: Maybe<Scalars['String']['output']>;
};

/** response of any mutation on the table "item_order_type" */
export type Item_Order_Type_Mutation_Response = {
  __typename?: 'item_order_type_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int']['output'];
  /** data from the rows affected by the mutation */
  returning: Array<Item_Order_Type>;
};

/** on_conflict condition type for table "item_order_type" */
export type Item_Order_Type_On_Conflict = {
  constraint: Item_Order_Type_Constraint;
  update_columns?: Array<Item_Order_Type_Update_Column>;
  where?: InputMaybe<Item_Order_Type_Bool_Exp>;
};

/** Ordering options when selecting data from "item_order_type". */
export type Item_Order_Type_Order_By = {
  value?: InputMaybe<Order_By>;
};

/** primary key columns input for table: item_order_type */
export type Item_Order_Type_Pk_Columns_Input = {
  value: Scalars['String']['input'];
};

/** select columns of table "item_order_type" */
export enum Item_Order_Type_Select_Column {
  /** column name */
  Value = 'value'
}

/** input type for updating data in table "item_order_type" */
export type Item_Order_Type_Set_Input = {
  value?: InputMaybe<Scalars['String']['input']>;
};

/** Streaming cursor of the table "item_order_type" */
export type Item_Order_Type_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Item_Order_Type_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Item_Order_Type_Stream_Cursor_Value_Input = {
  value?: InputMaybe<Scalars['String']['input']>;
};

/** update columns of table "item_order_type" */
export enum Item_Order_Type_Update_Column {
  /** column name */
  Value = 'value'
}

export type Item_Order_Type_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Item_Order_Type_Set_Input>;
  /** filter the rows which have to be updated */
  where: Item_Order_Type_Bool_Exp;
};

/** columns and relationships of "league" */
export type League = {
  __typename?: 'league';
  category_id?: Maybe<Scalars['String']['output']>;
  delve_event: Scalars['Boolean']['output'];
  description?: Maybe<Scalars['String']['output']>;
  end_at: Scalars['timestamptz']['output'];
  id: Scalars['String']['output'];
  realm: Scalars['String']['output'];
  register_at: Scalars['timestamptz']['output'];
  start_at: Scalars['timestamptz']['output'];
  url?: Maybe<Scalars['String']['output']>;
};

/** aggregated selection of "league" */
export type League_Aggregate = {
  __typename?: 'league_aggregate';
  aggregate?: Maybe<League_Aggregate_Fields>;
  nodes: Array<League>;
};

/** aggregate fields of "league" */
export type League_Aggregate_Fields = {
  __typename?: 'league_aggregate_fields';
  count: Scalars['Int']['output'];
  max?: Maybe<League_Max_Fields>;
  min?: Maybe<League_Min_Fields>;
};


/** aggregate fields of "league" */
export type League_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<League_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Boolean expression to filter rows from the table "league". All fields are combined with a logical 'AND'. */
export type League_Bool_Exp = {
  _and?: InputMaybe<Array<League_Bool_Exp>>;
  _not?: InputMaybe<League_Bool_Exp>;
  _or?: InputMaybe<Array<League_Bool_Exp>>;
  category_id?: InputMaybe<String_Comparison_Exp>;
  delve_event?: InputMaybe<Boolean_Comparison_Exp>;
  description?: InputMaybe<String_Comparison_Exp>;
  end_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  realm?: InputMaybe<String_Comparison_Exp>;
  register_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  start_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  url?: InputMaybe<String_Comparison_Exp>;
};

/** columns and relationships of "league_category" */
export type League_Category = {
  __typename?: 'league_category';
  current: Scalars['Boolean']['output'];
  id: Scalars['String']['output'];
};

/** aggregated selection of "league_category" */
export type League_Category_Aggregate = {
  __typename?: 'league_category_aggregate';
  aggregate?: Maybe<League_Category_Aggregate_Fields>;
  nodes: Array<League_Category>;
};

/** aggregate fields of "league_category" */
export type League_Category_Aggregate_Fields = {
  __typename?: 'league_category_aggregate_fields';
  count: Scalars['Int']['output'];
  max?: Maybe<League_Category_Max_Fields>;
  min?: Maybe<League_Category_Min_Fields>;
};


/** aggregate fields of "league_category" */
export type League_Category_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<League_Category_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Boolean expression to filter rows from the table "league_category". All fields are combined with a logical 'AND'. */
export type League_Category_Bool_Exp = {
  _and?: InputMaybe<Array<League_Category_Bool_Exp>>;
  _not?: InputMaybe<League_Category_Bool_Exp>;
  _or?: InputMaybe<Array<League_Category_Bool_Exp>>;
  current?: InputMaybe<Boolean_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "league_category" */
export enum League_Category_Constraint {
  /** unique or primary key constraint on columns "id" */
  LeagueCategoryPkey = 'league_category_pkey'
}

/** input type for inserting data into table "league_category" */
export type League_Category_Insert_Input = {
  current?: InputMaybe<Scalars['Boolean']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
};

/** aggregate max on columns */
export type League_Category_Max_Fields = {
  __typename?: 'league_category_max_fields';
  id?: Maybe<Scalars['String']['output']>;
};

/** aggregate min on columns */
export type League_Category_Min_Fields = {
  __typename?: 'league_category_min_fields';
  id?: Maybe<Scalars['String']['output']>;
};

/** response of any mutation on the table "league_category" */
export type League_Category_Mutation_Response = {
  __typename?: 'league_category_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int']['output'];
  /** data from the rows affected by the mutation */
  returning: Array<League_Category>;
};

/** on_conflict condition type for table "league_category" */
export type League_Category_On_Conflict = {
  constraint: League_Category_Constraint;
  update_columns?: Array<League_Category_Update_Column>;
  where?: InputMaybe<League_Category_Bool_Exp>;
};

/** Ordering options when selecting data from "league_category". */
export type League_Category_Order_By = {
  current?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
};

/** primary key columns input for table: league_category */
export type League_Category_Pk_Columns_Input = {
  id: Scalars['String']['input'];
};

/** select columns of table "league_category" */
export enum League_Category_Select_Column {
  /** column name */
  Current = 'current',
  /** column name */
  Id = 'id'
}

/** input type for updating data in table "league_category" */
export type League_Category_Set_Input = {
  current?: InputMaybe<Scalars['Boolean']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
};

/** Streaming cursor of the table "league_category" */
export type League_Category_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: League_Category_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type League_Category_Stream_Cursor_Value_Input = {
  current?: InputMaybe<Scalars['Boolean']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
};

/** update columns of table "league_category" */
export enum League_Category_Update_Column {
  /** column name */
  Current = 'current',
  /** column name */
  Id = 'id'
}

export type League_Category_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<League_Category_Set_Input>;
  /** filter the rows which have to be updated */
  where: League_Category_Bool_Exp;
};

/** unique or primary key constraints on table "league" */
export enum League_Constraint {
  /** unique or primary key constraint on columns "id" */
  LeaguePkey = 'league_pkey'
}

/** input type for inserting data into table "league" */
export type League_Insert_Input = {
  category_id?: InputMaybe<Scalars['String']['input']>;
  delve_event?: InputMaybe<Scalars['Boolean']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  end_at?: InputMaybe<Scalars['timestamptz']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  realm?: InputMaybe<Scalars['String']['input']>;
  register_at?: InputMaybe<Scalars['timestamptz']['input']>;
  start_at?: InputMaybe<Scalars['timestamptz']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
};

/** aggregate max on columns */
export type League_Max_Fields = {
  __typename?: 'league_max_fields';
  category_id?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  end_at?: Maybe<Scalars['timestamptz']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  realm?: Maybe<Scalars['String']['output']>;
  register_at?: Maybe<Scalars['timestamptz']['output']>;
  start_at?: Maybe<Scalars['timestamptz']['output']>;
  url?: Maybe<Scalars['String']['output']>;
};

/** aggregate min on columns */
export type League_Min_Fields = {
  __typename?: 'league_min_fields';
  category_id?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  end_at?: Maybe<Scalars['timestamptz']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  realm?: Maybe<Scalars['String']['output']>;
  register_at?: Maybe<Scalars['timestamptz']['output']>;
  start_at?: Maybe<Scalars['timestamptz']['output']>;
  url?: Maybe<Scalars['String']['output']>;
};

/** response of any mutation on the table "league" */
export type League_Mutation_Response = {
  __typename?: 'league_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int']['output'];
  /** data from the rows affected by the mutation */
  returning: Array<League>;
};

/** on_conflict condition type for table "league" */
export type League_On_Conflict = {
  constraint: League_Constraint;
  update_columns?: Array<League_Update_Column>;
  where?: InputMaybe<League_Bool_Exp>;
};

/** Ordering options when selecting data from "league". */
export type League_Order_By = {
  category_id?: InputMaybe<Order_By>;
  delve_event?: InputMaybe<Order_By>;
  description?: InputMaybe<Order_By>;
  end_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  realm?: InputMaybe<Order_By>;
  register_at?: InputMaybe<Order_By>;
  start_at?: InputMaybe<Order_By>;
  url?: InputMaybe<Order_By>;
};

/** primary key columns input for table: league */
export type League_Pk_Columns_Input = {
  id: Scalars['String']['input'];
};

/** columns and relationships of "league_rules" */
export type League_Rules = {
  __typename?: 'league_rules';
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  league_id?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
};

/** aggregated selection of "league_rules" */
export type League_Rules_Aggregate = {
  __typename?: 'league_rules_aggregate';
  aggregate?: Maybe<League_Rules_Aggregate_Fields>;
  nodes: Array<League_Rules>;
};

/** aggregate fields of "league_rules" */
export type League_Rules_Aggregate_Fields = {
  __typename?: 'league_rules_aggregate_fields';
  count: Scalars['Int']['output'];
  max?: Maybe<League_Rules_Max_Fields>;
  min?: Maybe<League_Rules_Min_Fields>;
};


/** aggregate fields of "league_rules" */
export type League_Rules_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<League_Rules_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Boolean expression to filter rows from the table "league_rules". All fields are combined with a logical 'AND'. */
export type League_Rules_Bool_Exp = {
  _and?: InputMaybe<Array<League_Rules_Bool_Exp>>;
  _not?: InputMaybe<League_Rules_Bool_Exp>;
  _or?: InputMaybe<Array<League_Rules_Bool_Exp>>;
  description?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  league_id?: InputMaybe<String_Comparison_Exp>;
  name?: InputMaybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "league_rules" */
export enum League_Rules_Constraint {
  /** unique or primary key constraint on columns "id" */
  LeagueRulesPkey = 'league_rules_pkey'
}

/** input type for inserting data into table "league_rules" */
export type League_Rules_Insert_Input = {
  description?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  league_id?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

/** aggregate max on columns */
export type League_Rules_Max_Fields = {
  __typename?: 'league_rules_max_fields';
  description?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  league_id?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

/** aggregate min on columns */
export type League_Rules_Min_Fields = {
  __typename?: 'league_rules_min_fields';
  description?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  league_id?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

/** response of any mutation on the table "league_rules" */
export type League_Rules_Mutation_Response = {
  __typename?: 'league_rules_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int']['output'];
  /** data from the rows affected by the mutation */
  returning: Array<League_Rules>;
};

/** on_conflict condition type for table "league_rules" */
export type League_Rules_On_Conflict = {
  constraint: League_Rules_Constraint;
  update_columns?: Array<League_Rules_Update_Column>;
  where?: InputMaybe<League_Rules_Bool_Exp>;
};

/** Ordering options when selecting data from "league_rules". */
export type League_Rules_Order_By = {
  description?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  league_id?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
};

/** primary key columns input for table: league_rules */
export type League_Rules_Pk_Columns_Input = {
  id: Scalars['String']['input'];
};

/** select columns of table "league_rules" */
export enum League_Rules_Select_Column {
  /** column name */
  Description = 'description',
  /** column name */
  Id = 'id',
  /** column name */
  LeagueId = 'league_id',
  /** column name */
  Name = 'name'
}

/** input type for updating data in table "league_rules" */
export type League_Rules_Set_Input = {
  description?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  league_id?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

/** Streaming cursor of the table "league_rules" */
export type League_Rules_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: League_Rules_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type League_Rules_Stream_Cursor_Value_Input = {
  description?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  league_id?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

/** update columns of table "league_rules" */
export enum League_Rules_Update_Column {
  /** column name */
  Description = 'description',
  /** column name */
  Id = 'id',
  /** column name */
  LeagueId = 'league_id',
  /** column name */
  Name = 'name'
}

export type League_Rules_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<League_Rules_Set_Input>;
  /** filter the rows which have to be updated */
  where: League_Rules_Bool_Exp;
};

/** select columns of table "league" */
export enum League_Select_Column {
  /** column name */
  CategoryId = 'category_id',
  /** column name */
  DelveEvent = 'delve_event',
  /** column name */
  Description = 'description',
  /** column name */
  EndAt = 'end_at',
  /** column name */
  Id = 'id',
  /** column name */
  Realm = 'realm',
  /** column name */
  RegisterAt = 'register_at',
  /** column name */
  StartAt = 'start_at',
  /** column name */
  Url = 'url'
}

/** input type for updating data in table "league" */
export type League_Set_Input = {
  category_id?: InputMaybe<Scalars['String']['input']>;
  delve_event?: InputMaybe<Scalars['Boolean']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  end_at?: InputMaybe<Scalars['timestamptz']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  realm?: InputMaybe<Scalars['String']['input']>;
  register_at?: InputMaybe<Scalars['timestamptz']['input']>;
  start_at?: InputMaybe<Scalars['timestamptz']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
};

/** Streaming cursor of the table "league" */
export type League_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: League_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type League_Stream_Cursor_Value_Input = {
  category_id?: InputMaybe<Scalars['String']['input']>;
  delve_event?: InputMaybe<Scalars['Boolean']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  end_at?: InputMaybe<Scalars['timestamptz']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  realm?: InputMaybe<Scalars['String']['input']>;
  register_at?: InputMaybe<Scalars['timestamptz']['input']>;
  start_at?: InputMaybe<Scalars['timestamptz']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
};

/** columns and relationships of "league_type" */
export type League_Type = {
  __typename?: 'league_type';
  value: Scalars['String']['output'];
};

/** aggregated selection of "league_type" */
export type League_Type_Aggregate = {
  __typename?: 'league_type_aggregate';
  aggregate?: Maybe<League_Type_Aggregate_Fields>;
  nodes: Array<League_Type>;
};

/** aggregate fields of "league_type" */
export type League_Type_Aggregate_Fields = {
  __typename?: 'league_type_aggregate_fields';
  count: Scalars['Int']['output'];
  max?: Maybe<League_Type_Max_Fields>;
  min?: Maybe<League_Type_Min_Fields>;
};


/** aggregate fields of "league_type" */
export type League_Type_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<League_Type_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Boolean expression to filter rows from the table "league_type". All fields are combined with a logical 'AND'. */
export type League_Type_Bool_Exp = {
  _and?: InputMaybe<Array<League_Type_Bool_Exp>>;
  _not?: InputMaybe<League_Type_Bool_Exp>;
  _or?: InputMaybe<Array<League_Type_Bool_Exp>>;
  value?: InputMaybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "league_type" */
export enum League_Type_Constraint {
  /** unique or primary key constraint on columns "value" */
  LeagueTypePkey = 'league_type_pkey'
}

export enum League_Type_Enum {
  Abyss = 'abyss',
  AltarEater = 'altar_eater',
  AltarExarch = 'altar_exarch',
  Bestiary = 'bestiary',
  Betrayal = 'betrayal',
  Beyond = 'beyond',
  Blight = 'blight',
  Breach = 'breach',
  Delirium = 'delirium',
  Delve = 'delve',
  Essence = 'essence',
  Expedition = 'expedition',
  Harbinger = 'harbinger',
  Harvest = 'harvest',
  Heist = 'heist',
  Incursion = 'incursion',
  Labyrinth = 'labyrinth',
  Legion = 'legion',
  Ritual = 'ritual',
  Sanctum = 'sanctum',
  SettlersOfKalguur = 'settlers_of_kalguur',
  Ultimatum = 'ultimatum'
}

/** Boolean expression to compare columns of type "league_type_enum". All fields are combined with logical 'AND'. */
export type League_Type_Enum_Comparison_Exp = {
  _eq?: InputMaybe<League_Type_Enum>;
  _in?: InputMaybe<Array<League_Type_Enum>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _neq?: InputMaybe<League_Type_Enum>;
  _nin?: InputMaybe<Array<League_Type_Enum>>;
};

/** input type for inserting data into table "league_type" */
export type League_Type_Insert_Input = {
  value?: InputMaybe<Scalars['String']['input']>;
};

/** aggregate max on columns */
export type League_Type_Max_Fields = {
  __typename?: 'league_type_max_fields';
  value?: Maybe<Scalars['String']['output']>;
};

/** aggregate min on columns */
export type League_Type_Min_Fields = {
  __typename?: 'league_type_min_fields';
  value?: Maybe<Scalars['String']['output']>;
};

/** response of any mutation on the table "league_type" */
export type League_Type_Mutation_Response = {
  __typename?: 'league_type_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int']['output'];
  /** data from the rows affected by the mutation */
  returning: Array<League_Type>;
};

/** on_conflict condition type for table "league_type" */
export type League_Type_On_Conflict = {
  constraint: League_Type_Constraint;
  update_columns?: Array<League_Type_Update_Column>;
  where?: InputMaybe<League_Type_Bool_Exp>;
};

/** Ordering options when selecting data from "league_type". */
export type League_Type_Order_By = {
  value?: InputMaybe<Order_By>;
};

/** primary key columns input for table: league_type */
export type League_Type_Pk_Columns_Input = {
  value: Scalars['String']['input'];
};

/** select columns of table "league_type" */
export enum League_Type_Select_Column {
  /** column name */
  Value = 'value'
}

/** input type for updating data in table "league_type" */
export type League_Type_Set_Input = {
  value?: InputMaybe<Scalars['String']['input']>;
};

/** Streaming cursor of the table "league_type" */
export type League_Type_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: League_Type_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type League_Type_Stream_Cursor_Value_Input = {
  value?: InputMaybe<Scalars['String']['input']>;
};

/** update columns of table "league_type" */
export enum League_Type_Update_Column {
  /** column name */
  Value = 'value'
}

export type League_Type_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<League_Type_Set_Input>;
  /** filter the rows which have to be updated */
  where: League_Type_Bool_Exp;
};

/** update columns of table "league" */
export enum League_Update_Column {
  /** column name */
  CategoryId = 'category_id',
  /** column name */
  DelveEvent = 'delve_event',
  /** column name */
  Description = 'description',
  /** column name */
  EndAt = 'end_at',
  /** column name */
  Id = 'id',
  /** column name */
  Realm = 'realm',
  /** column name */
  RegisterAt = 'register_at',
  /** column name */
  StartAt = 'start_at',
  /** column name */
  Url = 'url'
}

export type League_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<League_Set_Input>;
  /** filter the rows which have to be updated */
  where: League_Bool_Exp;
};

/** mutation root */
export type Mutation_Root = {
  __typename?: 'mutation_root';
  /** delete data from the table: "character" */
  delete_character?: Maybe<Character_Mutation_Response>;
  /** delete single row from the table: "character" */
  delete_character_by_pk?: Maybe<Character>;
  /** delete data from the table: "item_order_type" */
  delete_item_order_type?: Maybe<Item_Order_Type_Mutation_Response>;
  /** delete single row from the table: "item_order_type" */
  delete_item_order_type_by_pk?: Maybe<Item_Order_Type>;
  /** delete data from the table: "league" */
  delete_league?: Maybe<League_Mutation_Response>;
  /** delete single row from the table: "league" */
  delete_league_by_pk?: Maybe<League>;
  /** delete data from the table: "league_category" */
  delete_league_category?: Maybe<League_Category_Mutation_Response>;
  /** delete single row from the table: "league_category" */
  delete_league_category_by_pk?: Maybe<League_Category>;
  /** delete data from the table: "league_rules" */
  delete_league_rules?: Maybe<League_Rules_Mutation_Response>;
  /** delete single row from the table: "league_rules" */
  delete_league_rules_by_pk?: Maybe<League_Rules>;
  /** delete data from the table: "league_type" */
  delete_league_type?: Maybe<League_Type_Mutation_Response>;
  /** delete single row from the table: "league_type" */
  delete_league_type_by_pk?: Maybe<League_Type>;
  /** delete data from the table: "user" */
  delete_user?: Maybe<User_Mutation_Response>;
  /** delete single row from the table: "user" */
  delete_user_by_pk?: Maybe<User>;
  /** delete data from the table: "user_item_order" */
  delete_user_item_order?: Maybe<User_Item_Order_Mutation_Response>;
  /** delete single row from the table: "user_item_order" */
  delete_user_item_order_by_pk?: Maybe<User_Item_Order>;
  /** delete data from the table: "user_league_mechanic" */
  delete_user_league_mechanic?: Maybe<User_League_Mechanic_Mutation_Response>;
  /** delete single row from the table: "user_league_mechanic" */
  delete_user_league_mechanic_by_pk?: Maybe<User_League_Mechanic>;
  /** insert data into the table: "character" */
  insert_character?: Maybe<Character_Mutation_Response>;
  /** insert a single row into the table: "character" */
  insert_character_one?: Maybe<Character>;
  /** insert data into the table: "item_order_type" */
  insert_item_order_type?: Maybe<Item_Order_Type_Mutation_Response>;
  /** insert a single row into the table: "item_order_type" */
  insert_item_order_type_one?: Maybe<Item_Order_Type>;
  /** insert data into the table: "league" */
  insert_league?: Maybe<League_Mutation_Response>;
  /** insert data into the table: "league_category" */
  insert_league_category?: Maybe<League_Category_Mutation_Response>;
  /** insert a single row into the table: "league_category" */
  insert_league_category_one?: Maybe<League_Category>;
  /** insert a single row into the table: "league" */
  insert_league_one?: Maybe<League>;
  /** insert data into the table: "league_rules" */
  insert_league_rules?: Maybe<League_Rules_Mutation_Response>;
  /** insert a single row into the table: "league_rules" */
  insert_league_rules_one?: Maybe<League_Rules>;
  /** insert data into the table: "league_type" */
  insert_league_type?: Maybe<League_Type_Mutation_Response>;
  /** insert a single row into the table: "league_type" */
  insert_league_type_one?: Maybe<League_Type>;
  /** insert data into the table: "user" */
  insert_user?: Maybe<User_Mutation_Response>;
  /** insert data into the table: "user_item_order" */
  insert_user_item_order?: Maybe<User_Item_Order_Mutation_Response>;
  /** insert a single row into the table: "user_item_order" */
  insert_user_item_order_one?: Maybe<User_Item_Order>;
  /** insert data into the table: "user_league_mechanic" */
  insert_user_league_mechanic?: Maybe<User_League_Mechanic_Mutation_Response>;
  /** insert a single row into the table: "user_league_mechanic" */
  insert_user_league_mechanic_one?: Maybe<User_League_Mechanic>;
  /** insert a single row into the table: "user" */
  insert_user_one?: Maybe<User>;
  /** update data of the table: "character" */
  update_character?: Maybe<Character_Mutation_Response>;
  /** update single row of the table: "character" */
  update_character_by_pk?: Maybe<Character>;
  /** update multiples rows of table: "character" */
  update_character_many?: Maybe<Array<Maybe<Character_Mutation_Response>>>;
  /** update data of the table: "item_order_type" */
  update_item_order_type?: Maybe<Item_Order_Type_Mutation_Response>;
  /** update single row of the table: "item_order_type" */
  update_item_order_type_by_pk?: Maybe<Item_Order_Type>;
  /** update multiples rows of table: "item_order_type" */
  update_item_order_type_many?: Maybe<Array<Maybe<Item_Order_Type_Mutation_Response>>>;
  /** update data of the table: "league" */
  update_league?: Maybe<League_Mutation_Response>;
  /** update single row of the table: "league" */
  update_league_by_pk?: Maybe<League>;
  /** update data of the table: "league_category" */
  update_league_category?: Maybe<League_Category_Mutation_Response>;
  /** update single row of the table: "league_category" */
  update_league_category_by_pk?: Maybe<League_Category>;
  /** update multiples rows of table: "league_category" */
  update_league_category_many?: Maybe<Array<Maybe<League_Category_Mutation_Response>>>;
  /** update multiples rows of table: "league" */
  update_league_many?: Maybe<Array<Maybe<League_Mutation_Response>>>;
  /** update data of the table: "league_rules" */
  update_league_rules?: Maybe<League_Rules_Mutation_Response>;
  /** update single row of the table: "league_rules" */
  update_league_rules_by_pk?: Maybe<League_Rules>;
  /** update multiples rows of table: "league_rules" */
  update_league_rules_many?: Maybe<Array<Maybe<League_Rules_Mutation_Response>>>;
  /** update data of the table: "league_type" */
  update_league_type?: Maybe<League_Type_Mutation_Response>;
  /** update single row of the table: "league_type" */
  update_league_type_by_pk?: Maybe<League_Type>;
  /** update multiples rows of table: "league_type" */
  update_league_type_many?: Maybe<Array<Maybe<League_Type_Mutation_Response>>>;
  /** update data of the table: "user" */
  update_user?: Maybe<User_Mutation_Response>;
  /** update single row of the table: "user" */
  update_user_by_pk?: Maybe<User>;
  /** update data of the table: "user_item_order" */
  update_user_item_order?: Maybe<User_Item_Order_Mutation_Response>;
  /** update single row of the table: "user_item_order" */
  update_user_item_order_by_pk?: Maybe<User_Item_Order>;
  /** update multiples rows of table: "user_item_order" */
  update_user_item_order_many?: Maybe<Array<Maybe<User_Item_Order_Mutation_Response>>>;
  /** update data of the table: "user_league_mechanic" */
  update_user_league_mechanic?: Maybe<User_League_Mechanic_Mutation_Response>;
  /** update single row of the table: "user_league_mechanic" */
  update_user_league_mechanic_by_pk?: Maybe<User_League_Mechanic>;
  /** update multiples rows of table: "user_league_mechanic" */
  update_user_league_mechanic_many?: Maybe<Array<Maybe<User_League_Mechanic_Mutation_Response>>>;
  /** update multiples rows of table: "user" */
  update_user_many?: Maybe<Array<Maybe<User_Mutation_Response>>>;
};


/** mutation root */
export type Mutation_RootDelete_CharacterArgs = {
  where: Character_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Character_By_PkArgs = {
  id: Scalars['String']['input'];
};


/** mutation root */
export type Mutation_RootDelete_Item_Order_TypeArgs = {
  where: Item_Order_Type_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Item_Order_Type_By_PkArgs = {
  value: Scalars['String']['input'];
};


/** mutation root */
export type Mutation_RootDelete_LeagueArgs = {
  where: League_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_League_By_PkArgs = {
  id: Scalars['String']['input'];
};


/** mutation root */
export type Mutation_RootDelete_League_CategoryArgs = {
  where: League_Category_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_League_Category_By_PkArgs = {
  id: Scalars['String']['input'];
};


/** mutation root */
export type Mutation_RootDelete_League_RulesArgs = {
  where: League_Rules_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_League_Rules_By_PkArgs = {
  id: Scalars['String']['input'];
};


/** mutation root */
export type Mutation_RootDelete_League_TypeArgs = {
  where: League_Type_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_League_Type_By_PkArgs = {
  value: Scalars['String']['input'];
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
export type Mutation_RootDelete_User_Item_OrderArgs = {
  where: User_Item_Order_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_User_Item_Order_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


/** mutation root */
export type Mutation_RootDelete_User_League_MechanicArgs = {
  where: User_League_Mechanic_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_User_League_Mechanic_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


/** mutation root */
export type Mutation_RootInsert_CharacterArgs = {
  objects: Array<Character_Insert_Input>;
  on_conflict?: InputMaybe<Character_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Character_OneArgs = {
  object: Character_Insert_Input;
  on_conflict?: InputMaybe<Character_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Item_Order_TypeArgs = {
  objects: Array<Item_Order_Type_Insert_Input>;
  on_conflict?: InputMaybe<Item_Order_Type_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Item_Order_Type_OneArgs = {
  object: Item_Order_Type_Insert_Input;
  on_conflict?: InputMaybe<Item_Order_Type_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_LeagueArgs = {
  objects: Array<League_Insert_Input>;
  on_conflict?: InputMaybe<League_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_League_CategoryArgs = {
  objects: Array<League_Category_Insert_Input>;
  on_conflict?: InputMaybe<League_Category_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_League_Category_OneArgs = {
  object: League_Category_Insert_Input;
  on_conflict?: InputMaybe<League_Category_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_League_OneArgs = {
  object: League_Insert_Input;
  on_conflict?: InputMaybe<League_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_League_RulesArgs = {
  objects: Array<League_Rules_Insert_Input>;
  on_conflict?: InputMaybe<League_Rules_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_League_Rules_OneArgs = {
  object: League_Rules_Insert_Input;
  on_conflict?: InputMaybe<League_Rules_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_League_TypeArgs = {
  objects: Array<League_Type_Insert_Input>;
  on_conflict?: InputMaybe<League_Type_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_League_Type_OneArgs = {
  object: League_Type_Insert_Input;
  on_conflict?: InputMaybe<League_Type_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_UserArgs = {
  objects: Array<User_Insert_Input>;
  on_conflict?: InputMaybe<User_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_User_Item_OrderArgs = {
  objects: Array<User_Item_Order_Insert_Input>;
  on_conflict?: InputMaybe<User_Item_Order_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_User_Item_Order_OneArgs = {
  object: User_Item_Order_Insert_Input;
  on_conflict?: InputMaybe<User_Item_Order_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_User_League_MechanicArgs = {
  objects: Array<User_League_Mechanic_Insert_Input>;
  on_conflict?: InputMaybe<User_League_Mechanic_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_User_League_Mechanic_OneArgs = {
  object: User_League_Mechanic_Insert_Input;
  on_conflict?: InputMaybe<User_League_Mechanic_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_User_OneArgs = {
  object: User_Insert_Input;
  on_conflict?: InputMaybe<User_On_Conflict>;
};


/** mutation root */
export type Mutation_RootUpdate_CharacterArgs = {
  _inc?: InputMaybe<Character_Inc_Input>;
  _set?: InputMaybe<Character_Set_Input>;
  where: Character_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_Character_By_PkArgs = {
  _inc?: InputMaybe<Character_Inc_Input>;
  _set?: InputMaybe<Character_Set_Input>;
  pk_columns: Character_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_Character_ManyArgs = {
  updates: Array<Character_Updates>;
};


/** mutation root */
export type Mutation_RootUpdate_Item_Order_TypeArgs = {
  _set?: InputMaybe<Item_Order_Type_Set_Input>;
  where: Item_Order_Type_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_Item_Order_Type_By_PkArgs = {
  _set?: InputMaybe<Item_Order_Type_Set_Input>;
  pk_columns: Item_Order_Type_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_Item_Order_Type_ManyArgs = {
  updates: Array<Item_Order_Type_Updates>;
};


/** mutation root */
export type Mutation_RootUpdate_LeagueArgs = {
  _set?: InputMaybe<League_Set_Input>;
  where: League_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_League_By_PkArgs = {
  _set?: InputMaybe<League_Set_Input>;
  pk_columns: League_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_League_CategoryArgs = {
  _set?: InputMaybe<League_Category_Set_Input>;
  where: League_Category_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_League_Category_By_PkArgs = {
  _set?: InputMaybe<League_Category_Set_Input>;
  pk_columns: League_Category_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_League_Category_ManyArgs = {
  updates: Array<League_Category_Updates>;
};


/** mutation root */
export type Mutation_RootUpdate_League_ManyArgs = {
  updates: Array<League_Updates>;
};


/** mutation root */
export type Mutation_RootUpdate_League_RulesArgs = {
  _set?: InputMaybe<League_Rules_Set_Input>;
  where: League_Rules_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_League_Rules_By_PkArgs = {
  _set?: InputMaybe<League_Rules_Set_Input>;
  pk_columns: League_Rules_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_League_Rules_ManyArgs = {
  updates: Array<League_Rules_Updates>;
};


/** mutation root */
export type Mutation_RootUpdate_League_TypeArgs = {
  _set?: InputMaybe<League_Type_Set_Input>;
  where: League_Type_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_League_Type_By_PkArgs = {
  _set?: InputMaybe<League_Type_Set_Input>;
  pk_columns: League_Type_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_League_Type_ManyArgs = {
  updates: Array<League_Type_Updates>;
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
export type Mutation_RootUpdate_User_Item_OrderArgs = {
  _set?: InputMaybe<User_Item_Order_Set_Input>;
  where: User_Item_Order_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_User_Item_Order_By_PkArgs = {
  _set?: InputMaybe<User_Item_Order_Set_Input>;
  pk_columns: User_Item_Order_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_User_Item_Order_ManyArgs = {
  updates: Array<User_Item_Order_Updates>;
};


/** mutation root */
export type Mutation_RootUpdate_User_League_MechanicArgs = {
  _set?: InputMaybe<User_League_Mechanic_Set_Input>;
  where: User_League_Mechanic_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_User_League_Mechanic_By_PkArgs = {
  _set?: InputMaybe<User_League_Mechanic_Set_Input>;
  pk_columns: User_League_Mechanic_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_User_League_Mechanic_ManyArgs = {
  updates: Array<User_League_Mechanic_Updates>;
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
  /** fetch data from the table: "character" */
  character: Array<Character>;
  /** fetch aggregated fields from the table: "character" */
  character_aggregate: Character_Aggregate;
  /** fetch data from the table: "character" using primary key columns */
  character_by_pk?: Maybe<Character>;
  /** fetch data from the table: "item_order_type" */
  item_order_type: Array<Item_Order_Type>;
  /** fetch aggregated fields from the table: "item_order_type" */
  item_order_type_aggregate: Item_Order_Type_Aggregate;
  /** fetch data from the table: "item_order_type" using primary key columns */
  item_order_type_by_pk?: Maybe<Item_Order_Type>;
  /** fetch data from the table: "league" */
  league: Array<League>;
  /** fetch aggregated fields from the table: "league" */
  league_aggregate: League_Aggregate;
  /** fetch data from the table: "league" using primary key columns */
  league_by_pk?: Maybe<League>;
  /** fetch data from the table: "league_category" */
  league_category: Array<League_Category>;
  /** fetch aggregated fields from the table: "league_category" */
  league_category_aggregate: League_Category_Aggregate;
  /** fetch data from the table: "league_category" using primary key columns */
  league_category_by_pk?: Maybe<League_Category>;
  /** fetch data from the table: "league_rules" */
  league_rules: Array<League_Rules>;
  /** fetch aggregated fields from the table: "league_rules" */
  league_rules_aggregate: League_Rules_Aggregate;
  /** fetch data from the table: "league_rules" using primary key columns */
  league_rules_by_pk?: Maybe<League_Rules>;
  /** fetch data from the table: "league_type" */
  league_type: Array<League_Type>;
  /** fetch aggregated fields from the table: "league_type" */
  league_type_aggregate: League_Type_Aggregate;
  /** fetch data from the table: "league_type" using primary key columns */
  league_type_by_pk?: Maybe<League_Type>;
  /** fetch data from the table: "user" */
  user: Array<User>;
  /** fetch aggregated fields from the table: "user" */
  user_aggregate: User_Aggregate;
  /** fetch data from the table: "user" using primary key columns */
  user_by_pk?: Maybe<User>;
  /** fetch data from the table: "user_item_order" */
  user_item_order: Array<User_Item_Order>;
  /** fetch aggregated fields from the table: "user_item_order" */
  user_item_order_aggregate: User_Item_Order_Aggregate;
  /** fetch data from the table: "user_item_order" using primary key columns */
  user_item_order_by_pk?: Maybe<User_Item_Order>;
  /** fetch data from the table: "user_league_mechanic" */
  user_league_mechanic: Array<User_League_Mechanic>;
  /** fetch aggregated fields from the table: "user_league_mechanic" */
  user_league_mechanic_aggregate: User_League_Mechanic_Aggregate;
  /** fetch data from the table: "user_league_mechanic" using primary key columns */
  user_league_mechanic_by_pk?: Maybe<User_League_Mechanic>;
};


export type Query_RootCharacterArgs = {
  distinct_on?: InputMaybe<Array<Character_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Character_Order_By>>;
  where?: InputMaybe<Character_Bool_Exp>;
};


export type Query_RootCharacter_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Character_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Character_Order_By>>;
  where?: InputMaybe<Character_Bool_Exp>;
};


export type Query_RootCharacter_By_PkArgs = {
  id: Scalars['String']['input'];
};


export type Query_RootItem_Order_TypeArgs = {
  distinct_on?: InputMaybe<Array<Item_Order_Type_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Item_Order_Type_Order_By>>;
  where?: InputMaybe<Item_Order_Type_Bool_Exp>;
};


export type Query_RootItem_Order_Type_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Item_Order_Type_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Item_Order_Type_Order_By>>;
  where?: InputMaybe<Item_Order_Type_Bool_Exp>;
};


export type Query_RootItem_Order_Type_By_PkArgs = {
  value: Scalars['String']['input'];
};


export type Query_RootLeagueArgs = {
  distinct_on?: InputMaybe<Array<League_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<League_Order_By>>;
  where?: InputMaybe<League_Bool_Exp>;
};


export type Query_RootLeague_AggregateArgs = {
  distinct_on?: InputMaybe<Array<League_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<League_Order_By>>;
  where?: InputMaybe<League_Bool_Exp>;
};


export type Query_RootLeague_By_PkArgs = {
  id: Scalars['String']['input'];
};


export type Query_RootLeague_CategoryArgs = {
  distinct_on?: InputMaybe<Array<League_Category_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<League_Category_Order_By>>;
  where?: InputMaybe<League_Category_Bool_Exp>;
};


export type Query_RootLeague_Category_AggregateArgs = {
  distinct_on?: InputMaybe<Array<League_Category_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<League_Category_Order_By>>;
  where?: InputMaybe<League_Category_Bool_Exp>;
};


export type Query_RootLeague_Category_By_PkArgs = {
  id: Scalars['String']['input'];
};


export type Query_RootLeague_RulesArgs = {
  distinct_on?: InputMaybe<Array<League_Rules_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<League_Rules_Order_By>>;
  where?: InputMaybe<League_Rules_Bool_Exp>;
};


export type Query_RootLeague_Rules_AggregateArgs = {
  distinct_on?: InputMaybe<Array<League_Rules_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<League_Rules_Order_By>>;
  where?: InputMaybe<League_Rules_Bool_Exp>;
};


export type Query_RootLeague_Rules_By_PkArgs = {
  id: Scalars['String']['input'];
};


export type Query_RootLeague_TypeArgs = {
  distinct_on?: InputMaybe<Array<League_Type_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<League_Type_Order_By>>;
  where?: InputMaybe<League_Type_Bool_Exp>;
};


export type Query_RootLeague_Type_AggregateArgs = {
  distinct_on?: InputMaybe<Array<League_Type_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<League_Type_Order_By>>;
  where?: InputMaybe<League_Type_Bool_Exp>;
};


export type Query_RootLeague_Type_By_PkArgs = {
  value: Scalars['String']['input'];
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


export type Query_RootUser_Item_OrderArgs = {
  distinct_on?: InputMaybe<Array<User_Item_Order_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<User_Item_Order_Order_By>>;
  where?: InputMaybe<User_Item_Order_Bool_Exp>;
};


export type Query_RootUser_Item_Order_AggregateArgs = {
  distinct_on?: InputMaybe<Array<User_Item_Order_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<User_Item_Order_Order_By>>;
  where?: InputMaybe<User_Item_Order_Bool_Exp>;
};


export type Query_RootUser_Item_Order_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Query_RootUser_League_MechanicArgs = {
  distinct_on?: InputMaybe<Array<User_League_Mechanic_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<User_League_Mechanic_Order_By>>;
  where?: InputMaybe<User_League_Mechanic_Bool_Exp>;
};


export type Query_RootUser_League_Mechanic_AggregateArgs = {
  distinct_on?: InputMaybe<Array<User_League_Mechanic_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<User_League_Mechanic_Order_By>>;
  where?: InputMaybe<User_League_Mechanic_Bool_Exp>;
};


export type Query_RootUser_League_Mechanic_By_PkArgs = {
  id: Scalars['uuid']['input'];
};

export type Subscription_Root = {
  __typename?: 'subscription_root';
  /** fetch data from the table: "character" */
  character: Array<Character>;
  /** fetch aggregated fields from the table: "character" */
  character_aggregate: Character_Aggregate;
  /** fetch data from the table: "character" using primary key columns */
  character_by_pk?: Maybe<Character>;
  /** fetch data from the table in a streaming manner: "character" */
  character_stream: Array<Character>;
  /** fetch data from the table: "item_order_type" */
  item_order_type: Array<Item_Order_Type>;
  /** fetch aggregated fields from the table: "item_order_type" */
  item_order_type_aggregate: Item_Order_Type_Aggregate;
  /** fetch data from the table: "item_order_type" using primary key columns */
  item_order_type_by_pk?: Maybe<Item_Order_Type>;
  /** fetch data from the table in a streaming manner: "item_order_type" */
  item_order_type_stream: Array<Item_Order_Type>;
  /** fetch data from the table: "league" */
  league: Array<League>;
  /** fetch aggregated fields from the table: "league" */
  league_aggregate: League_Aggregate;
  /** fetch data from the table: "league" using primary key columns */
  league_by_pk?: Maybe<League>;
  /** fetch data from the table: "league_category" */
  league_category: Array<League_Category>;
  /** fetch aggregated fields from the table: "league_category" */
  league_category_aggregate: League_Category_Aggregate;
  /** fetch data from the table: "league_category" using primary key columns */
  league_category_by_pk?: Maybe<League_Category>;
  /** fetch data from the table in a streaming manner: "league_category" */
  league_category_stream: Array<League_Category>;
  /** fetch data from the table: "league_rules" */
  league_rules: Array<League_Rules>;
  /** fetch aggregated fields from the table: "league_rules" */
  league_rules_aggregate: League_Rules_Aggregate;
  /** fetch data from the table: "league_rules" using primary key columns */
  league_rules_by_pk?: Maybe<League_Rules>;
  /** fetch data from the table in a streaming manner: "league_rules" */
  league_rules_stream: Array<League_Rules>;
  /** fetch data from the table in a streaming manner: "league" */
  league_stream: Array<League>;
  /** fetch data from the table: "league_type" */
  league_type: Array<League_Type>;
  /** fetch aggregated fields from the table: "league_type" */
  league_type_aggregate: League_Type_Aggregate;
  /** fetch data from the table: "league_type" using primary key columns */
  league_type_by_pk?: Maybe<League_Type>;
  /** fetch data from the table in a streaming manner: "league_type" */
  league_type_stream: Array<League_Type>;
  /** fetch data from the table: "user" */
  user: Array<User>;
  /** fetch aggregated fields from the table: "user" */
  user_aggregate: User_Aggregate;
  /** fetch data from the table: "user" using primary key columns */
  user_by_pk?: Maybe<User>;
  /** fetch data from the table: "user_item_order" */
  user_item_order: Array<User_Item_Order>;
  /** fetch aggregated fields from the table: "user_item_order" */
  user_item_order_aggregate: User_Item_Order_Aggregate;
  /** fetch data from the table: "user_item_order" using primary key columns */
  user_item_order_by_pk?: Maybe<User_Item_Order>;
  /** fetch data from the table in a streaming manner: "user_item_order" */
  user_item_order_stream: Array<User_Item_Order>;
  /** fetch data from the table: "user_league_mechanic" */
  user_league_mechanic: Array<User_League_Mechanic>;
  /** fetch aggregated fields from the table: "user_league_mechanic" */
  user_league_mechanic_aggregate: User_League_Mechanic_Aggregate;
  /** fetch data from the table: "user_league_mechanic" using primary key columns */
  user_league_mechanic_by_pk?: Maybe<User_League_Mechanic>;
  /** fetch data from the table in a streaming manner: "user_league_mechanic" */
  user_league_mechanic_stream: Array<User_League_Mechanic>;
  /** fetch data from the table in a streaming manner: "user" */
  user_stream: Array<User>;
};


export type Subscription_RootCharacterArgs = {
  distinct_on?: InputMaybe<Array<Character_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Character_Order_By>>;
  where?: InputMaybe<Character_Bool_Exp>;
};


export type Subscription_RootCharacter_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Character_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Character_Order_By>>;
  where?: InputMaybe<Character_Bool_Exp>;
};


export type Subscription_RootCharacter_By_PkArgs = {
  id: Scalars['String']['input'];
};


export type Subscription_RootCharacter_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Character_Stream_Cursor_Input>>;
  where?: InputMaybe<Character_Bool_Exp>;
};


export type Subscription_RootItem_Order_TypeArgs = {
  distinct_on?: InputMaybe<Array<Item_Order_Type_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Item_Order_Type_Order_By>>;
  where?: InputMaybe<Item_Order_Type_Bool_Exp>;
};


export type Subscription_RootItem_Order_Type_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Item_Order_Type_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Item_Order_Type_Order_By>>;
  where?: InputMaybe<Item_Order_Type_Bool_Exp>;
};


export type Subscription_RootItem_Order_Type_By_PkArgs = {
  value: Scalars['String']['input'];
};


export type Subscription_RootItem_Order_Type_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Item_Order_Type_Stream_Cursor_Input>>;
  where?: InputMaybe<Item_Order_Type_Bool_Exp>;
};


export type Subscription_RootLeagueArgs = {
  distinct_on?: InputMaybe<Array<League_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<League_Order_By>>;
  where?: InputMaybe<League_Bool_Exp>;
};


export type Subscription_RootLeague_AggregateArgs = {
  distinct_on?: InputMaybe<Array<League_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<League_Order_By>>;
  where?: InputMaybe<League_Bool_Exp>;
};


export type Subscription_RootLeague_By_PkArgs = {
  id: Scalars['String']['input'];
};


export type Subscription_RootLeague_CategoryArgs = {
  distinct_on?: InputMaybe<Array<League_Category_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<League_Category_Order_By>>;
  where?: InputMaybe<League_Category_Bool_Exp>;
};


export type Subscription_RootLeague_Category_AggregateArgs = {
  distinct_on?: InputMaybe<Array<League_Category_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<League_Category_Order_By>>;
  where?: InputMaybe<League_Category_Bool_Exp>;
};


export type Subscription_RootLeague_Category_By_PkArgs = {
  id: Scalars['String']['input'];
};


export type Subscription_RootLeague_Category_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<League_Category_Stream_Cursor_Input>>;
  where?: InputMaybe<League_Category_Bool_Exp>;
};


export type Subscription_RootLeague_RulesArgs = {
  distinct_on?: InputMaybe<Array<League_Rules_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<League_Rules_Order_By>>;
  where?: InputMaybe<League_Rules_Bool_Exp>;
};


export type Subscription_RootLeague_Rules_AggregateArgs = {
  distinct_on?: InputMaybe<Array<League_Rules_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<League_Rules_Order_By>>;
  where?: InputMaybe<League_Rules_Bool_Exp>;
};


export type Subscription_RootLeague_Rules_By_PkArgs = {
  id: Scalars['String']['input'];
};


export type Subscription_RootLeague_Rules_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<League_Rules_Stream_Cursor_Input>>;
  where?: InputMaybe<League_Rules_Bool_Exp>;
};


export type Subscription_RootLeague_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<League_Stream_Cursor_Input>>;
  where?: InputMaybe<League_Bool_Exp>;
};


export type Subscription_RootLeague_TypeArgs = {
  distinct_on?: InputMaybe<Array<League_Type_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<League_Type_Order_By>>;
  where?: InputMaybe<League_Type_Bool_Exp>;
};


export type Subscription_RootLeague_Type_AggregateArgs = {
  distinct_on?: InputMaybe<Array<League_Type_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<League_Type_Order_By>>;
  where?: InputMaybe<League_Type_Bool_Exp>;
};


export type Subscription_RootLeague_Type_By_PkArgs = {
  value: Scalars['String']['input'];
};


export type Subscription_RootLeague_Type_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<League_Type_Stream_Cursor_Input>>;
  where?: InputMaybe<League_Type_Bool_Exp>;
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


export type Subscription_RootUser_Item_OrderArgs = {
  distinct_on?: InputMaybe<Array<User_Item_Order_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<User_Item_Order_Order_By>>;
  where?: InputMaybe<User_Item_Order_Bool_Exp>;
};


export type Subscription_RootUser_Item_Order_AggregateArgs = {
  distinct_on?: InputMaybe<Array<User_Item_Order_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<User_Item_Order_Order_By>>;
  where?: InputMaybe<User_Item_Order_Bool_Exp>;
};


export type Subscription_RootUser_Item_Order_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Subscription_RootUser_Item_Order_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<User_Item_Order_Stream_Cursor_Input>>;
  where?: InputMaybe<User_Item_Order_Bool_Exp>;
};


export type Subscription_RootUser_League_MechanicArgs = {
  distinct_on?: InputMaybe<Array<User_League_Mechanic_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<User_League_Mechanic_Order_By>>;
  where?: InputMaybe<User_League_Mechanic_Bool_Exp>;
};


export type Subscription_RootUser_League_Mechanic_AggregateArgs = {
  distinct_on?: InputMaybe<Array<User_League_Mechanic_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<User_League_Mechanic_Order_By>>;
  where?: InputMaybe<User_League_Mechanic_Bool_Exp>;
};


export type Subscription_RootUser_League_Mechanic_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Subscription_RootUser_League_Mechanic_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<User_League_Mechanic_Stream_Cursor_Input>>;
  where?: InputMaybe<User_League_Mechanic_Bool_Exp>;
};


export type Subscription_RootUser_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<User_Stream_Cursor_Input>>;
  where?: InputMaybe<User_Bool_Exp>;
};

/** Boolean expression to compare columns of type "timestamptz". All fields are combined with logical 'AND'. */
export type Timestamptz_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['timestamptz']['input']>;
  _gt?: InputMaybe<Scalars['timestamptz']['input']>;
  _gte?: InputMaybe<Scalars['timestamptz']['input']>;
  _in?: InputMaybe<Array<Scalars['timestamptz']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['timestamptz']['input']>;
  _lte?: InputMaybe<Scalars['timestamptz']['input']>;
  _neq?: InputMaybe<Scalars['timestamptz']['input']>;
  _nin?: InputMaybe<Array<Scalars['timestamptz']['input']>>;
};

/** columns and relationships of "user" */
export type User = {
  __typename?: 'user';
  discord_avatar?: Maybe<Scalars['String']['output']>;
  discord_name?: Maybe<Scalars['String']['output']>;
  discord_user_id?: Maybe<Scalars['String']['output']>;
  guild?: Maybe<Scalars['String']['output']>;
  id: Scalars['uuid']['output'];
  poe_name?: Maybe<Scalars['String']['output']>;
  poe_user_id?: Maybe<Scalars['String']['output']>;
  /** An array relationship */
  user_item_orders: Array<User_Item_Order>;
  /** An aggregate relationship */
  user_item_orders_aggregate: User_Item_Order_Aggregate;
  /** An array relationship */
  user_league_mechanics: Array<User_League_Mechanic>;
  /** An aggregate relationship */
  user_league_mechanics_aggregate: User_League_Mechanic_Aggregate;
};


/** columns and relationships of "user" */
export type UserUser_Item_OrdersArgs = {
  distinct_on?: InputMaybe<Array<User_Item_Order_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<User_Item_Order_Order_By>>;
  where?: InputMaybe<User_Item_Order_Bool_Exp>;
};


/** columns and relationships of "user" */
export type UserUser_Item_Orders_AggregateArgs = {
  distinct_on?: InputMaybe<Array<User_Item_Order_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<User_Item_Order_Order_By>>;
  where?: InputMaybe<User_Item_Order_Bool_Exp>;
};


/** columns and relationships of "user" */
export type UserUser_League_MechanicsArgs = {
  distinct_on?: InputMaybe<Array<User_League_Mechanic_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<User_League_Mechanic_Order_By>>;
  where?: InputMaybe<User_League_Mechanic_Bool_Exp>;
};


/** columns and relationships of "user" */
export type UserUser_League_Mechanics_AggregateArgs = {
  distinct_on?: InputMaybe<Array<User_League_Mechanic_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<User_League_Mechanic_Order_By>>;
  where?: InputMaybe<User_League_Mechanic_Bool_Exp>;
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
  guild?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  poe_name?: InputMaybe<String_Comparison_Exp>;
  poe_user_id?: InputMaybe<String_Comparison_Exp>;
  user_item_orders?: InputMaybe<User_Item_Order_Bool_Exp>;
  user_item_orders_aggregate?: InputMaybe<User_Item_Order_Aggregate_Bool_Exp>;
  user_league_mechanics?: InputMaybe<User_League_Mechanic_Bool_Exp>;
  user_league_mechanics_aggregate?: InputMaybe<User_League_Mechanic_Aggregate_Bool_Exp>;
};

/** unique or primary key constraints on table "user" */
export enum User_Constraint {
  /** unique or primary key constraint on columns "discord_user_id" */
  UserDiscordUserIdKey = 'user_discord_user_id_key',
  /** unique or primary key constraint on columns "id" */
  UserPkey = 'user_pkey',
  /** unique or primary key constraint on columns "poe_name" */
  UserPoeNameKey = 'user_poe_name_key',
  /** unique or primary key constraint on columns "poe_user_id" */
  UserPoeUserIdKey = 'user_poe_user_id_key'
}

/** input type for inserting data into table "user" */
export type User_Insert_Input = {
  discord_avatar?: InputMaybe<Scalars['String']['input']>;
  discord_name?: InputMaybe<Scalars['String']['input']>;
  discord_user_id?: InputMaybe<Scalars['String']['input']>;
  guild?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  poe_name?: InputMaybe<Scalars['String']['input']>;
  poe_user_id?: InputMaybe<Scalars['String']['input']>;
  user_item_orders?: InputMaybe<User_Item_Order_Arr_Rel_Insert_Input>;
  user_league_mechanics?: InputMaybe<User_League_Mechanic_Arr_Rel_Insert_Input>;
};

/** Item orders by specific users */
export type User_Item_Order = {
  __typename?: 'user_item_order';
  created_at: Scalars['timestamptz']['output'];
  description?: Maybe<Scalars['String']['output']>;
  fulfilled_by?: Maybe<Scalars['uuid']['output']>;
  /** An object relationship */
  fulfilled_by_user?: Maybe<User>;
  icon_url?: Maybe<Scalars['String']['output']>;
  id: Scalars['uuid']['output'];
  item_base_type?: Maybe<Scalars['String']['output']>;
  item_category?: Maybe<Scalars['String']['output']>;
  link_url?: Maybe<Scalars['String']['output']>;
  priority: Scalars['Boolean']['output'];
  type: Item_Order_Type_Enum;
  updated_at: Scalars['timestamptz']['output'];
  /** An object relationship */
  user: User;
  user_id: Scalars['uuid']['output'];
};

/** aggregated selection of "user_item_order" */
export type User_Item_Order_Aggregate = {
  __typename?: 'user_item_order_aggregate';
  aggregate?: Maybe<User_Item_Order_Aggregate_Fields>;
  nodes: Array<User_Item_Order>;
};

export type User_Item_Order_Aggregate_Bool_Exp = {
  bool_and?: InputMaybe<User_Item_Order_Aggregate_Bool_Exp_Bool_And>;
  bool_or?: InputMaybe<User_Item_Order_Aggregate_Bool_Exp_Bool_Or>;
  count?: InputMaybe<User_Item_Order_Aggregate_Bool_Exp_Count>;
};

export type User_Item_Order_Aggregate_Bool_Exp_Bool_And = {
  arguments: User_Item_Order_Select_Column_User_Item_Order_Aggregate_Bool_Exp_Bool_And_Arguments_Columns;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<User_Item_Order_Bool_Exp>;
  predicate: Boolean_Comparison_Exp;
};

export type User_Item_Order_Aggregate_Bool_Exp_Bool_Or = {
  arguments: User_Item_Order_Select_Column_User_Item_Order_Aggregate_Bool_Exp_Bool_Or_Arguments_Columns;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<User_Item_Order_Bool_Exp>;
  predicate: Boolean_Comparison_Exp;
};

export type User_Item_Order_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<User_Item_Order_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<User_Item_Order_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "user_item_order" */
export type User_Item_Order_Aggregate_Fields = {
  __typename?: 'user_item_order_aggregate_fields';
  count: Scalars['Int']['output'];
  max?: Maybe<User_Item_Order_Max_Fields>;
  min?: Maybe<User_Item_Order_Min_Fields>;
};


/** aggregate fields of "user_item_order" */
export type User_Item_Order_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<User_Item_Order_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** order by aggregate values of table "user_item_order" */
export type User_Item_Order_Aggregate_Order_By = {
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<User_Item_Order_Max_Order_By>;
  min?: InputMaybe<User_Item_Order_Min_Order_By>;
};

/** input type for inserting array relation for remote table "user_item_order" */
export type User_Item_Order_Arr_Rel_Insert_Input = {
  data: Array<User_Item_Order_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<User_Item_Order_On_Conflict>;
};

/** Boolean expression to filter rows from the table "user_item_order". All fields are combined with a logical 'AND'. */
export type User_Item_Order_Bool_Exp = {
  _and?: InputMaybe<Array<User_Item_Order_Bool_Exp>>;
  _not?: InputMaybe<User_Item_Order_Bool_Exp>;
  _or?: InputMaybe<Array<User_Item_Order_Bool_Exp>>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  description?: InputMaybe<String_Comparison_Exp>;
  fulfilled_by?: InputMaybe<Uuid_Comparison_Exp>;
  fulfilled_by_user?: InputMaybe<User_Bool_Exp>;
  icon_url?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  item_base_type?: InputMaybe<String_Comparison_Exp>;
  item_category?: InputMaybe<String_Comparison_Exp>;
  link_url?: InputMaybe<String_Comparison_Exp>;
  priority?: InputMaybe<Boolean_Comparison_Exp>;
  type?: InputMaybe<Item_Order_Type_Enum_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  user?: InputMaybe<User_Bool_Exp>;
  user_id?: InputMaybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "user_item_order" */
export enum User_Item_Order_Constraint {
  /** unique or primary key constraint on columns "id" */
  UserItemOrderPkey = 'user_item_order_pkey'
}

/** input type for inserting data into table "user_item_order" */
export type User_Item_Order_Insert_Input = {
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  fulfilled_by?: InputMaybe<Scalars['uuid']['input']>;
  fulfilled_by_user?: InputMaybe<User_Obj_Rel_Insert_Input>;
  icon_url?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  item_base_type?: InputMaybe<Scalars['String']['input']>;
  item_category?: InputMaybe<Scalars['String']['input']>;
  link_url?: InputMaybe<Scalars['String']['input']>;
  priority?: InputMaybe<Scalars['Boolean']['input']>;
  type?: InputMaybe<Item_Order_Type_Enum>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
  user?: InputMaybe<User_Obj_Rel_Insert_Input>;
  user_id?: InputMaybe<Scalars['uuid']['input']>;
};

/** aggregate max on columns */
export type User_Item_Order_Max_Fields = {
  __typename?: 'user_item_order_max_fields';
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  fulfilled_by?: Maybe<Scalars['uuid']['output']>;
  icon_url?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  item_base_type?: Maybe<Scalars['String']['output']>;
  item_category?: Maybe<Scalars['String']['output']>;
  link_url?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
  user_id?: Maybe<Scalars['uuid']['output']>;
};

/** order by max() on columns of table "user_item_order" */
export type User_Item_Order_Max_Order_By = {
  created_at?: InputMaybe<Order_By>;
  description?: InputMaybe<Order_By>;
  fulfilled_by?: InputMaybe<Order_By>;
  icon_url?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  item_base_type?: InputMaybe<Order_By>;
  item_category?: InputMaybe<Order_By>;
  link_url?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type User_Item_Order_Min_Fields = {
  __typename?: 'user_item_order_min_fields';
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  fulfilled_by?: Maybe<Scalars['uuid']['output']>;
  icon_url?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  item_base_type?: Maybe<Scalars['String']['output']>;
  item_category?: Maybe<Scalars['String']['output']>;
  link_url?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
  user_id?: Maybe<Scalars['uuid']['output']>;
};

/** order by min() on columns of table "user_item_order" */
export type User_Item_Order_Min_Order_By = {
  created_at?: InputMaybe<Order_By>;
  description?: InputMaybe<Order_By>;
  fulfilled_by?: InputMaybe<Order_By>;
  icon_url?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  item_base_type?: InputMaybe<Order_By>;
  item_category?: InputMaybe<Order_By>;
  link_url?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "user_item_order" */
export type User_Item_Order_Mutation_Response = {
  __typename?: 'user_item_order_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int']['output'];
  /** data from the rows affected by the mutation */
  returning: Array<User_Item_Order>;
};

/** on_conflict condition type for table "user_item_order" */
export type User_Item_Order_On_Conflict = {
  constraint: User_Item_Order_Constraint;
  update_columns?: Array<User_Item_Order_Update_Column>;
  where?: InputMaybe<User_Item_Order_Bool_Exp>;
};

/** Ordering options when selecting data from "user_item_order". */
export type User_Item_Order_Order_By = {
  created_at?: InputMaybe<Order_By>;
  description?: InputMaybe<Order_By>;
  fulfilled_by?: InputMaybe<Order_By>;
  fulfilled_by_user?: InputMaybe<User_Order_By>;
  icon_url?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  item_base_type?: InputMaybe<Order_By>;
  item_category?: InputMaybe<Order_By>;
  link_url?: InputMaybe<Order_By>;
  priority?: InputMaybe<Order_By>;
  type?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  user?: InputMaybe<User_Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** primary key columns input for table: user_item_order */
export type User_Item_Order_Pk_Columns_Input = {
  id: Scalars['uuid']['input'];
};

/** select columns of table "user_item_order" */
export enum User_Item_Order_Select_Column {
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  Description = 'description',
  /** column name */
  FulfilledBy = 'fulfilled_by',
  /** column name */
  IconUrl = 'icon_url',
  /** column name */
  Id = 'id',
  /** column name */
  ItemBaseType = 'item_base_type',
  /** column name */
  ItemCategory = 'item_category',
  /** column name */
  LinkUrl = 'link_url',
  /** column name */
  Priority = 'priority',
  /** column name */
  Type = 'type',
  /** column name */
  UpdatedAt = 'updated_at',
  /** column name */
  UserId = 'user_id'
}

/** select "user_item_order_aggregate_bool_exp_bool_and_arguments_columns" columns of table "user_item_order" */
export enum User_Item_Order_Select_Column_User_Item_Order_Aggregate_Bool_Exp_Bool_And_Arguments_Columns {
  /** column name */
  Priority = 'priority'
}

/** select "user_item_order_aggregate_bool_exp_bool_or_arguments_columns" columns of table "user_item_order" */
export enum User_Item_Order_Select_Column_User_Item_Order_Aggregate_Bool_Exp_Bool_Or_Arguments_Columns {
  /** column name */
  Priority = 'priority'
}

/** input type for updating data in table "user_item_order" */
export type User_Item_Order_Set_Input = {
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  fulfilled_by?: InputMaybe<Scalars['uuid']['input']>;
  icon_url?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  item_base_type?: InputMaybe<Scalars['String']['input']>;
  item_category?: InputMaybe<Scalars['String']['input']>;
  link_url?: InputMaybe<Scalars['String']['input']>;
  priority?: InputMaybe<Scalars['Boolean']['input']>;
  type?: InputMaybe<Item_Order_Type_Enum>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
  user_id?: InputMaybe<Scalars['uuid']['input']>;
};

/** Streaming cursor of the table "user_item_order" */
export type User_Item_Order_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: User_Item_Order_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type User_Item_Order_Stream_Cursor_Value_Input = {
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  fulfilled_by?: InputMaybe<Scalars['uuid']['input']>;
  icon_url?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  item_base_type?: InputMaybe<Scalars['String']['input']>;
  item_category?: InputMaybe<Scalars['String']['input']>;
  link_url?: InputMaybe<Scalars['String']['input']>;
  priority?: InputMaybe<Scalars['Boolean']['input']>;
  type?: InputMaybe<Item_Order_Type_Enum>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
  user_id?: InputMaybe<Scalars['uuid']['input']>;
};

/** update columns of table "user_item_order" */
export enum User_Item_Order_Update_Column {
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  Description = 'description',
  /** column name */
  FulfilledBy = 'fulfilled_by',
  /** column name */
  IconUrl = 'icon_url',
  /** column name */
  Id = 'id',
  /** column name */
  ItemBaseType = 'item_base_type',
  /** column name */
  ItemCategory = 'item_category',
  /** column name */
  LinkUrl = 'link_url',
  /** column name */
  Priority = 'priority',
  /** column name */
  Type = 'type',
  /** column name */
  UpdatedAt = 'updated_at',
  /** column name */
  UserId = 'user_id'
}

export type User_Item_Order_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<User_Item_Order_Set_Input>;
  /** filter the rows which have to be updated */
  where: User_Item_Order_Bool_Exp;
};

/** League mechanics that a given user is focussing on */
export type User_League_Mechanic = {
  __typename?: 'user_league_mechanic';
  id: Scalars['uuid']['output'];
  mechanic: League_Type_Enum;
  user_id: Scalars['uuid']['output'];
};

/** aggregated selection of "user_league_mechanic" */
export type User_League_Mechanic_Aggregate = {
  __typename?: 'user_league_mechanic_aggregate';
  aggregate?: Maybe<User_League_Mechanic_Aggregate_Fields>;
  nodes: Array<User_League_Mechanic>;
};

export type User_League_Mechanic_Aggregate_Bool_Exp = {
  count?: InputMaybe<User_League_Mechanic_Aggregate_Bool_Exp_Count>;
};

export type User_League_Mechanic_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<User_League_Mechanic_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<User_League_Mechanic_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "user_league_mechanic" */
export type User_League_Mechanic_Aggregate_Fields = {
  __typename?: 'user_league_mechanic_aggregate_fields';
  count: Scalars['Int']['output'];
  max?: Maybe<User_League_Mechanic_Max_Fields>;
  min?: Maybe<User_League_Mechanic_Min_Fields>;
};


/** aggregate fields of "user_league_mechanic" */
export type User_League_Mechanic_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<User_League_Mechanic_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** order by aggregate values of table "user_league_mechanic" */
export type User_League_Mechanic_Aggregate_Order_By = {
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<User_League_Mechanic_Max_Order_By>;
  min?: InputMaybe<User_League_Mechanic_Min_Order_By>;
};

/** input type for inserting array relation for remote table "user_league_mechanic" */
export type User_League_Mechanic_Arr_Rel_Insert_Input = {
  data: Array<User_League_Mechanic_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<User_League_Mechanic_On_Conflict>;
};

/** Boolean expression to filter rows from the table "user_league_mechanic". All fields are combined with a logical 'AND'. */
export type User_League_Mechanic_Bool_Exp = {
  _and?: InputMaybe<Array<User_League_Mechanic_Bool_Exp>>;
  _not?: InputMaybe<User_League_Mechanic_Bool_Exp>;
  _or?: InputMaybe<Array<User_League_Mechanic_Bool_Exp>>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  mechanic?: InputMaybe<League_Type_Enum_Comparison_Exp>;
  user_id?: InputMaybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "user_league_mechanic" */
export enum User_League_Mechanic_Constraint {
  /** unique or primary key constraint on columns "mechanic", "user_id" */
  UserLeagueMechanicMechanicUserIdKey = 'user_league_mechanic_mechanic_user_id_key',
  /** unique or primary key constraint on columns "id" */
  UserLeagueMechanicPkey = 'user_league_mechanic_pkey'
}

/** input type for inserting data into table "user_league_mechanic" */
export type User_League_Mechanic_Insert_Input = {
  id?: InputMaybe<Scalars['uuid']['input']>;
  mechanic?: InputMaybe<League_Type_Enum>;
  user_id?: InputMaybe<Scalars['uuid']['input']>;
};

/** aggregate max on columns */
export type User_League_Mechanic_Max_Fields = {
  __typename?: 'user_league_mechanic_max_fields';
  id?: Maybe<Scalars['uuid']['output']>;
  user_id?: Maybe<Scalars['uuid']['output']>;
};

/** order by max() on columns of table "user_league_mechanic" */
export type User_League_Mechanic_Max_Order_By = {
  id?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type User_League_Mechanic_Min_Fields = {
  __typename?: 'user_league_mechanic_min_fields';
  id?: Maybe<Scalars['uuid']['output']>;
  user_id?: Maybe<Scalars['uuid']['output']>;
};

/** order by min() on columns of table "user_league_mechanic" */
export type User_League_Mechanic_Min_Order_By = {
  id?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "user_league_mechanic" */
export type User_League_Mechanic_Mutation_Response = {
  __typename?: 'user_league_mechanic_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int']['output'];
  /** data from the rows affected by the mutation */
  returning: Array<User_League_Mechanic>;
};

/** on_conflict condition type for table "user_league_mechanic" */
export type User_League_Mechanic_On_Conflict = {
  constraint: User_League_Mechanic_Constraint;
  update_columns?: Array<User_League_Mechanic_Update_Column>;
  where?: InputMaybe<User_League_Mechanic_Bool_Exp>;
};

/** Ordering options when selecting data from "user_league_mechanic". */
export type User_League_Mechanic_Order_By = {
  id?: InputMaybe<Order_By>;
  mechanic?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** primary key columns input for table: user_league_mechanic */
export type User_League_Mechanic_Pk_Columns_Input = {
  id: Scalars['uuid']['input'];
};

/** select columns of table "user_league_mechanic" */
export enum User_League_Mechanic_Select_Column {
  /** column name */
  Id = 'id',
  /** column name */
  Mechanic = 'mechanic',
  /** column name */
  UserId = 'user_id'
}

/** input type for updating data in table "user_league_mechanic" */
export type User_League_Mechanic_Set_Input = {
  id?: InputMaybe<Scalars['uuid']['input']>;
  mechanic?: InputMaybe<League_Type_Enum>;
  user_id?: InputMaybe<Scalars['uuid']['input']>;
};

/** Streaming cursor of the table "user_league_mechanic" */
export type User_League_Mechanic_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: User_League_Mechanic_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type User_League_Mechanic_Stream_Cursor_Value_Input = {
  id?: InputMaybe<Scalars['uuid']['input']>;
  mechanic?: InputMaybe<League_Type_Enum>;
  user_id?: InputMaybe<Scalars['uuid']['input']>;
};

/** update columns of table "user_league_mechanic" */
export enum User_League_Mechanic_Update_Column {
  /** column name */
  Id = 'id',
  /** column name */
  Mechanic = 'mechanic',
  /** column name */
  UserId = 'user_id'
}

export type User_League_Mechanic_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<User_League_Mechanic_Set_Input>;
  /** filter the rows which have to be updated */
  where: User_League_Mechanic_Bool_Exp;
};

/** aggregate max on columns */
export type User_Max_Fields = {
  __typename?: 'user_max_fields';
  discord_avatar?: Maybe<Scalars['String']['output']>;
  discord_name?: Maybe<Scalars['String']['output']>;
  discord_user_id?: Maybe<Scalars['String']['output']>;
  guild?: Maybe<Scalars['String']['output']>;
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
  guild?: Maybe<Scalars['String']['output']>;
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

/** input type for inserting object relation for remote table "user" */
export type User_Obj_Rel_Insert_Input = {
  data: User_Insert_Input;
  /** upsert condition */
  on_conflict?: InputMaybe<User_On_Conflict>;
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
  guild?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  poe_name?: InputMaybe<Order_By>;
  poe_user_id?: InputMaybe<Order_By>;
  user_item_orders_aggregate?: InputMaybe<User_Item_Order_Aggregate_Order_By>;
  user_league_mechanics_aggregate?: InputMaybe<User_League_Mechanic_Aggregate_Order_By>;
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
  Guild = 'guild',
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
  guild?: InputMaybe<Scalars['String']['input']>;
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
  guild?: InputMaybe<Scalars['String']['input']>;
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
  Guild = 'guild',
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

export type LeagueCharactersSubscriptionVariables = Exact<{
  leagueName?: InputMaybe<Scalars['String']['input']>;
}>;


export type LeagueCharactersSubscription = { __typename?: 'subscription_root', character: Array<{ __typename?: 'character', twitch?: string | null, retired: boolean, poe_account_name: string, rank: number, name: string, level: number, id: string, experience: any, dead: boolean, class: string, challenges: number }> };

export type LeagueQueryVariables = Exact<{ [key: string]: never; }>;


export type LeagueQuery = { __typename?: 'query_root', league: Array<{ __typename?: 'league', url?: string | null, start_at: string, register_at: string, realm: string, id: string, end_at: string, delve_event: boolean, description?: string | null, category_id?: string | null }> };

export type LeaguesQueryVariables = Exact<{ [key: string]: never; }>;


export type LeaguesQuery = { __typename?: 'query_root', league_type: Array<{ __typename?: 'league_type', value: string }> };

export type OrderTypesQueryVariables = Exact<{ [key: string]: never; }>;


export type OrderTypesQuery = { __typename?: 'query_root', item_order_type: Array<{ __typename?: 'item_order_type', value: string }> };

export type RegisteredUsersSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type RegisteredUsersSubscription = { __typename?: 'subscription_root', user_aggregate: { __typename?: 'user_aggregate', aggregate?: { __typename?: 'user_aggregate_fields', count: number } | null } };

export type UserItemOrdersSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type UserItemOrdersSubscription = { __typename?: 'subscription_root', user_item_order: Array<{ __typename?: 'user_item_order', created_at: string, updated_at: string, description?: string | null, id: string, link_url?: string | null, type: Item_Order_Type_Enum, item_base_type?: string | null, item_category?: string | null, icon_url?: string | null, priority: boolean, user: { __typename?: 'user', guild?: string | null, id: string, poe_name?: string | null, discord_name?: string | null, discord_user_id?: string | null, discord_avatar?: string | null }, fulfilled_by_user?: { __typename?: 'user', discord_name?: string | null, discord_user_id?: string | null, discord_avatar?: string | null } | null }> };

export type InsertUserItemOrderMutationVariables = Exact<{
  description: Scalars['String']['input'];
  linkUrl: Scalars['String']['input'];
  type: Item_Order_Type_Enum;
  userId: Scalars['uuid']['input'];
  priority: Scalars['Boolean']['input'];
  itemCategory?: InputMaybe<Scalars['String']['input']>;
  itemBaseType?: InputMaybe<Scalars['String']['input']>;
  iconUrl?: InputMaybe<Scalars['String']['input']>;
}>;


export type InsertUserItemOrderMutation = { __typename?: 'mutation_root', insert_user_item_order_one?: { __typename?: 'user_item_order', type: Item_Order_Type_Enum, link_url?: string | null, description?: string | null, user_id: string, id: string, priority: boolean, item_base_type?: string | null, icon_url?: string | null, item_category?: string | null } | null };

export type UpdateUserItemOrderMutationVariables = Exact<{
  orderId: Scalars['uuid']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Item_Order_Type_Enum>;
  linkUrl?: InputMaybe<Scalars['String']['input']>;
  priority: Scalars['Boolean']['input'];
  itemBaseType?: InputMaybe<Scalars['String']['input']>;
  itemCategory?: InputMaybe<Scalars['String']['input']>;
  iconUrl?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpdateUserItemOrderMutation = { __typename?: 'mutation_root', update_user_item_order_by_pk?: { __typename?: 'user_item_order', id: string, priority: boolean, description?: string | null, link_url?: string | null, user_id: string, item_base_type?: string | null, icon_url?: string | null, item_category?: string | null } | null };

export type FulfillUserItemOrderMutationVariables = Exact<{
  orderId: Scalars['uuid']['input'];
  fulfilledBy: Scalars['uuid']['input'];
}>;


export type FulfillUserItemOrderMutation = { __typename?: 'mutation_root', update_user_item_order_by_pk?: { __typename?: 'user_item_order', id: string, description?: string | null, link_url?: string | null, user_id: string } | null };

export type DeleteUserItemOrderMutationVariables = Exact<{
  orderId: Scalars['uuid']['input'];
}>;


export type DeleteUserItemOrderMutation = { __typename?: 'mutation_root', delete_user_item_order_by_pk?: { __typename?: 'user_item_order', id: string, description?: string | null, link_url?: string | null, user_id: string } | null };

export type InsertUserLeagueMechanicMutationVariables = Exact<{
  mechanic: League_Type_Enum;
  userId: Scalars['uuid']['input'];
}>;


export type InsertUserLeagueMechanicMutation = { __typename?: 'mutation_root', insert_user_league_mechanic_one?: { __typename?: 'user_league_mechanic', mechanic: League_Type_Enum, user_id: string, id: string } | null };

export type DeleteUserLeagueMechanicMutationVariables = Exact<{
  mechanicId: Scalars['uuid']['input'];
}>;


export type DeleteUserLeagueMechanicMutation = { __typename?: 'mutation_root', delete_user_league_mechanic_by_pk?: { __typename?: 'user_league_mechanic', id: string, mechanic: League_Type_Enum, user_id: string } | null };

export type UserFieldsFragment = { __typename?: 'user', id: string, guild?: string | null, poe_name?: string | null, poe_user_id?: string | null, discord_name?: string | null, discord_avatar?: string | null, discord_user_id?: string | null, user_league_mechanics: Array<{ __typename?: 'user_league_mechanic', id: string, mechanic: League_Type_Enum }> };

export type UsersQueryVariables = Exact<{ [key: string]: never; }>;


export type UsersQuery = { __typename?: 'query_root', user: Array<{ __typename?: 'user', id: string, guild?: string | null, poe_name?: string | null, poe_user_id?: string | null, discord_name?: string | null, discord_avatar?: string | null, discord_user_id?: string | null, user_league_mechanics: Array<{ __typename?: 'user_league_mechanic', id: string, mechanic: League_Type_Enum }> }> };

export type UserByIdQueryVariables = Exact<{
  id: Scalars['uuid']['input'];
}>;


export type UserByIdQuery = { __typename?: 'query_root', user_by_pk?: { __typename?: 'user', id: string, guild?: string | null, poe_name?: string | null, poe_user_id?: string | null, discord_name?: string | null, discord_avatar?: string | null, discord_user_id?: string | null, user_league_mechanics: Array<{ __typename?: 'user_league_mechanic', id: string, mechanic: League_Type_Enum }> } | null };

export type UsersSubSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type UsersSubSubscription = { __typename?: 'subscription_root', user: Array<{ __typename?: 'user', id: string, guild?: string | null, poe_name?: string | null, poe_user_id?: string | null, discord_name?: string | null, discord_avatar?: string | null, discord_user_id?: string | null, user_league_mechanics: Array<{ __typename?: 'user_league_mechanic', id: string, mechanic: League_Type_Enum }> }> };

export type SetMyGuildMutationVariables = Exact<{
  userId: Scalars['uuid']['input'];
  guild: Scalars['String']['input'];
}>;


export type SetMyGuildMutation = { __typename?: 'mutation_root', update_user_by_pk?: { __typename?: 'user', id: string, guild?: string | null } | null };

export const UserFieldsFragmentDoc = gql`
    fragment UserFields on user {
  id
  guild
  poe_name
  poe_user_id
  discord_name
  discord_avatar
  discord_user_id
  user_league_mechanics {
    id
    mechanic
  }
}
    `;
export const LeagueCharactersDocument = gql`
    subscription LeagueCharacters($leagueName: String) {
  character(order_by: {rank: asc}, where: {league: {_eq: $leagueName}}) {
    twitch
    retired
    poe_account_name
    rank
    name
    level
    id
    experience
    dead
    class
    challenges
  }
}
    `;
export type LeagueCharactersSubscriptionResult = Apollo.SubscriptionResult<LeagueCharactersSubscription>;
export const LeagueDocument = gql`
    query League {
  league(order_by: {start_at: desc}, limit: 1) {
    url
    start_at
    register_at
    realm
    id
    end_at
    delve_event
    description
    category_id
  }
}
    `;
export type LeagueQueryResult = Apollo.QueryResult<LeagueQuery, LeagueQueryVariables>;
export const LeaguesDocument = gql`
    query Leagues {
  league_type {
    value
  }
}
    `;
export type LeaguesQueryResult = Apollo.QueryResult<LeaguesQuery, LeaguesQueryVariables>;
export const OrderTypesDocument = gql`
    query OrderTypes {
  item_order_type {
    value
  }
}
    `;
export type OrderTypesQueryResult = Apollo.QueryResult<OrderTypesQuery, OrderTypesQueryVariables>;
export const RegisteredUsersDocument = gql`
    subscription RegisteredUsers {
  user_aggregate {
    aggregate {
      count
    }
  }
}
    `;
export type RegisteredUsersSubscriptionResult = Apollo.SubscriptionResult<RegisteredUsersSubscription>;
export const UserItemOrdersDocument = gql`
    subscription UserItemOrders {
  user_item_order(order_by: {updated_at: desc}) {
    created_at
    updated_at
    description
    id
    link_url
    type
    item_base_type
    item_category
    icon_url
    priority
    user {
      guild
      id
      poe_name
      discord_name
      discord_user_id
      discord_avatar
    }
    fulfilled_by_user {
      discord_name
      discord_user_id
      discord_avatar
    }
  }
}
    `;
export type UserItemOrdersSubscriptionResult = Apollo.SubscriptionResult<UserItemOrdersSubscription>;
export const InsertUserItemOrderDocument = gql`
    mutation InsertUserItemOrder($description: String!, $linkUrl: String!, $type: item_order_type_enum!, $userId: uuid!, $priority: Boolean!, $itemCategory: String, $itemBaseType: String, $iconUrl: String) {
  insert_user_item_order_one(
    object: {description: $description, link_url: $linkUrl, user_id: $userId, type: $type, priority: $priority, item_base_type: $itemBaseType, item_category: $itemCategory, icon_url: $iconUrl}
  ) {
    type
    link_url
    description
    user_id
    id
    priority
    item_base_type
    icon_url
    item_category
  }
}
    `;
export type InsertUserItemOrderMutationFn = Apollo.MutationFunction<InsertUserItemOrderMutation, InsertUserItemOrderMutationVariables>;
export type InsertUserItemOrderMutationResult = Apollo.MutationResult<InsertUserItemOrderMutation>;
export type InsertUserItemOrderMutationOptions = Apollo.BaseMutationOptions<InsertUserItemOrderMutation, InsertUserItemOrderMutationVariables>;
export const UpdateUserItemOrderDocument = gql`
    mutation UpdateUserItemOrder($orderId: uuid!, $description: String, $type: item_order_type_enum, $linkUrl: String, $priority: Boolean!, $itemBaseType: String, $itemCategory: String, $iconUrl: String) {
  update_user_item_order_by_pk(
    pk_columns: {id: $orderId}
    _set: {description: $description, link_url: $linkUrl, type: $type, priority: $priority, item_base_type: $itemBaseType, icon_url: $iconUrl, item_category: $itemCategory}
  ) {
    id
    priority
    description
    link_url
    user_id
    item_base_type
    icon_url
    item_category
  }
}
    `;
export type UpdateUserItemOrderMutationFn = Apollo.MutationFunction<UpdateUserItemOrderMutation, UpdateUserItemOrderMutationVariables>;
export type UpdateUserItemOrderMutationResult = Apollo.MutationResult<UpdateUserItemOrderMutation>;
export type UpdateUserItemOrderMutationOptions = Apollo.BaseMutationOptions<UpdateUserItemOrderMutation, UpdateUserItemOrderMutationVariables>;
export const FulfillUserItemOrderDocument = gql`
    mutation FulfillUserItemOrder($orderId: uuid!, $fulfilledBy: uuid!) {
  update_user_item_order_by_pk(
    pk_columns: {id: $orderId}
    _set: {fulfilled_by: $fulfilledBy}
  ) {
    id
    description
    link_url
    user_id
  }
}
    `;
export type FulfillUserItemOrderMutationFn = Apollo.MutationFunction<FulfillUserItemOrderMutation, FulfillUserItemOrderMutationVariables>;
export type FulfillUserItemOrderMutationResult = Apollo.MutationResult<FulfillUserItemOrderMutation>;
export type FulfillUserItemOrderMutationOptions = Apollo.BaseMutationOptions<FulfillUserItemOrderMutation, FulfillUserItemOrderMutationVariables>;
export const DeleteUserItemOrderDocument = gql`
    mutation DeleteUserItemOrder($orderId: uuid!) {
  delete_user_item_order_by_pk(id: $orderId) {
    id
    description
    link_url
    user_id
  }
}
    `;
export type DeleteUserItemOrderMutationFn = Apollo.MutationFunction<DeleteUserItemOrderMutation, DeleteUserItemOrderMutationVariables>;
export type DeleteUserItemOrderMutationResult = Apollo.MutationResult<DeleteUserItemOrderMutation>;
export type DeleteUserItemOrderMutationOptions = Apollo.BaseMutationOptions<DeleteUserItemOrderMutation, DeleteUserItemOrderMutationVariables>;
export const InsertUserLeagueMechanicDocument = gql`
    mutation InsertUserLeagueMechanic($mechanic: league_type_enum!, $userId: uuid!) {
  insert_user_league_mechanic_one(object: {mechanic: $mechanic, user_id: $userId}) {
    mechanic
    user_id
    id
  }
}
    `;
export type InsertUserLeagueMechanicMutationFn = Apollo.MutationFunction<InsertUserLeagueMechanicMutation, InsertUserLeagueMechanicMutationVariables>;
export type InsertUserLeagueMechanicMutationResult = Apollo.MutationResult<InsertUserLeagueMechanicMutation>;
export type InsertUserLeagueMechanicMutationOptions = Apollo.BaseMutationOptions<InsertUserLeagueMechanicMutation, InsertUserLeagueMechanicMutationVariables>;
export const DeleteUserLeagueMechanicDocument = gql`
    mutation DeleteUserLeagueMechanic($mechanicId: uuid!) {
  delete_user_league_mechanic_by_pk(id: $mechanicId) {
    id
    mechanic
    user_id
  }
}
    `;
export type DeleteUserLeagueMechanicMutationFn = Apollo.MutationFunction<DeleteUserLeagueMechanicMutation, DeleteUserLeagueMechanicMutationVariables>;
export type DeleteUserLeagueMechanicMutationResult = Apollo.MutationResult<DeleteUserLeagueMechanicMutation>;
export type DeleteUserLeagueMechanicMutationOptions = Apollo.BaseMutationOptions<DeleteUserLeagueMechanicMutation, DeleteUserLeagueMechanicMutationVariables>;
export const UsersDocument = gql`
    query Users {
  user(order_by: {discord_name: asc}) {
    ...UserFields
  }
}
    ${UserFieldsFragmentDoc}`;
export type UsersQueryResult = Apollo.QueryResult<UsersQuery, UsersQueryVariables>;
export const UserByIdDocument = gql`
    query UserById($id: uuid!) {
  user_by_pk(id: $id) {
    ...UserFields
  }
}
    ${UserFieldsFragmentDoc}`;
export type UserByIdQueryResult = Apollo.QueryResult<UserByIdQuery, UserByIdQueryVariables>;
export const UsersSubDocument = gql`
    subscription UsersSub {
  user(order_by: {discord_name: asc}) {
    ...UserFields
  }
}
    ${UserFieldsFragmentDoc}`;
export type UsersSubSubscriptionResult = Apollo.SubscriptionResult<UsersSubSubscription>;
export const SetMyGuildDocument = gql`
    mutation SetMyGuild($userId: uuid!, $guild: String!) {
  update_user_by_pk(pk_columns: {id: $userId}, _set: {guild: $guild}) {
    id
    guild
  }
}
    `;
export type SetMyGuildMutationFn = Apollo.MutationFunction<SetMyGuildMutation, SetMyGuildMutationVariables>;
export type SetMyGuildMutationResult = Apollo.MutationResult<SetMyGuildMutation>;
export type SetMyGuildMutationOptions = Apollo.BaseMutationOptions<SetMyGuildMutation, SetMyGuildMutationVariables>;

      export interface PossibleTypesResultData {
        possibleTypes: {
          [key: string]: string[]
        }
      }
      const result: PossibleTypesResultData = {
  "possibleTypes": {}
};
      export default result;
    