"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, where, type DocumentData } from "firebase/firestore";
import { firebaseServices } from "./client";

export type SocialAccount = { id:string; username:string; connectionStatus:string; lastSyncedAt?:unknown };
export type SocialPost = { id:string; caption?:string; mediaType:string; mediaUrl?:string; thumbnailUrl?:string; permalink?:string; publishedAt?:string };
export type SocialInsight = { id:string; socialPostId?:string|null; scope:"post"|"account"; metric:string; value:unknown; snapshotDate:string };
export type ScheduledPost = { id:string; caption?:string; status:string; scheduledAt?:unknown; platformPostId?:string|null; lastError?:string|null };

function row<T>(id:string, data:DocumentData):T { return {id,...data} as T; }
export function dateOf(value:unknown):Date|null {
  if (!value) return null;
  if (typeof value === "object" && value && "toDate" in value && typeof (value as {toDate?:unknown}).toDate === "function") return (value as {toDate:()=>Date}).toDate();
  const date = new Date(String(value)); return Number.isNaN(date.getTime()) ? null : date;
}
export function numeric(value:unknown):number { return typeof value === "number" && Number.isFinite(value) ? value : 0; }

export function useSignalData() {
  const [account,setAccount]=useState<SocialAccount|null>(null);
  const [posts,setPosts]=useState<SocialPost[]>([]);
  const [insights,setInsights]=useState<SocialInsight[]>([]);
  const [scheduled,setScheduled]=useState<ScheduledPost[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [isReviewer,setIsReviewer]=useState(false);
  useEffect(()=>onAuthStateChanged(firebaseServices().auth,user=>{
    let cancelled=false;
    let unsubs:(()=>void)[]=[];
    if(!user){setIsReviewer(false);setLoading(false);return;}
    const {db}=firebaseServices();
    void user.getIdTokenResult().then(result=>{
      if(cancelled)return;
      const claim=result.claims.reviewOwnerId;
      const ownerId=user.uid;
      setIsReviewer(typeof claim==="string");
      unsubs=[
        onSnapshot(query(collection(db,"socialAccounts"),where("userId","==",ownerId)),snap=>{setAccount(snap.docs[0]?row<SocialAccount>(snap.docs[0].id,snap.docs[0].data()):null);setLoading(false)},e=>{setError(e.message);setLoading(false)}),
        onSnapshot(query(collection(db,"socialPosts"),where("userId","==",ownerId)),snap=>setPosts(snap.docs.map(d=>row<SocialPost>(d.id,d.data())).sort((a,b)=>String(b.publishedAt||"").localeCompare(String(a.publishedAt||"")))),e=>setError(e.message)),
        onSnapshot(query(collection(db,"socialInsights"),where("userId","==",ownerId)),snap=>setInsights(snap.docs.map(d=>row<SocialInsight>(d.id,d.data()))),e=>setError(e.message)),
        onSnapshot(query(collection(db,"scheduledPosts"),where("userId","==",ownerId)),snap=>setScheduled(snap.docs.map(d=>row<ScheduledPost>(d.id,d.data())).sort((a,b)=>(dateOf(a.scheduledAt)?.getTime()||0)-(dateOf(b.scheduledAt)?.getTime()||0))),e=>setError(e.message)),
      ];
    }).catch(e=>{if(!cancelled){setError(e instanceof Error?e.message:"Could not verify authentication.（認証情報を確認できませんでした）");setLoading(false)}});
    return ()=>{cancelled=true;unsubs.forEach(fn=>fn())};
  }),[]);
  const postInsights=useMemo(()=>{const map:Record<string,Record<string,number>>={};for(const x of insights){if(x.scope!=="post"||!x.socialPostId)continue;(map[x.socialPostId]??={})[x.metric]=numeric(x.value)}return map},[insights]);
  const accountInsights=useMemo(()=>{const map:Record<string,number>={};for(const x of insights)if(x.scope==="account")map[x.metric]=numeric(x.value);return map},[insights]);
  return {account,posts,insights,scheduled,postInsights,accountInsights,loading,error,isReviewer};
}
