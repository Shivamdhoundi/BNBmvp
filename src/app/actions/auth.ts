"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData, nextPath?: string) {
  const email = String(formData.get("email") || "admin@staypilot.com");
  // Trim spaces and remove surrounding quotes in case the user pasted them
  const rawPassword = String(formData.get("password"));
  const password = rawPassword.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');

  if (password !== "SHIVAMD0N@123") {
    console.error(`Received password: [${password}] instead of [SHIVAMD0N@123]`);
    return { error: "Invalid master password." };
  }

  const supabase = await createClient();
  
  // Attempt to sign in
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // If sign in fails, try to sign up automatically (first time setup)
  if (error) {
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: "StayPilot Admin" },
      }
    });
    
    if (signUpError) {
      return { error: `Supabase SignUp Error: ${signUpError.message}` };
    }
    
    // Let's try signing in again just in case
    const { error: secondSignInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (secondSignInError) {
      return { error: `Supabase SignIn Error: ${secondSignInError.message}` };
    }
  }

  redirect(nextPath && nextPath.startsWith("/") ? nextPath : "/dashboard");
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const fullName = String(formData.get("fullName"));

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/confirm`,
    },
  });

  if (error) {
    return { error: error.message };
  }
  
  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
