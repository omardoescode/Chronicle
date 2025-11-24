import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, fetchGraphQL } from '@/lib/api'
import { cn } from '@/lib/utils'

const GENERATE_API_KEY_MUTATION = `
  mutation GenerateApiKey {
    generateApiKey {
      success
      data { api_key }
      errors
    }
  }
`

export default function SettingsPage() {
  const [user] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('user_data')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const [apiKey, setApiKey] = useState('')
  const [loadingKey, setLoadingKey] = useState(false)

  const handleGenerateKey = async () => {
    if (apiKey || loadingKey) return

    setLoadingKey(true)
    try {
      const res = await fetchGraphQL<any>(GENERATE_API_KEY_MUTATION)
      if (res.generateApiKey?.success) {
        setApiKey(res.generateApiKey.data.api_key)
        toast.success('New API Key generated')
      } else {
        throw new Error('Failed to generate key')
      }
    } catch (error) {
      toast.error('Failed to generate key')
      setApiKey('Error generating key')
    } finally {
      setLoadingKey(false)
    }
  }

  const handleCopyKey = () => {
    if (apiKey && !loadingKey && !apiKey.startsWith('Error')) {
      navigator.clipboard.writeText(apiKey)
      toast.success('Copied to clipboard')
    }
  }

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold tracking-tight">Settings</h3>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Manage your public profile information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              toast.error('Profile updates are currently disabled')
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                defaultValue={user?.name || ''}
                placeholder="Your Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                defaultValue={user?.email || ''}
                placeholder="email@example.com"
                type="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apikey">API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="apikey"
                    value={apiKey}
                    readOnly
                    onClick={handleGenerateKey}
                    className={cn(
                      'font-mono bg-muted pr-10 cursor-pointer',
                      apiKey && 'cursor-text'
                    )}
                    placeholder={
                      loadingKey
                        ? 'Generating...'
                        : 'Click here to generate a new API key'
                    }
                  />
                  {loadingKey && (
                    <div className="absolute right-3 top-2.5">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyKey}
                  disabled={loadingKey || !apiKey || apiKey.startsWith('Error')}
                >
                  Copy
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Click the box above to generate a secure API key.
              </p>
            </div>

            <div className="pt-4">
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
