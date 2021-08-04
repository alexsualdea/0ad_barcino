let Debug = {}

Debug.enabled = false;

if (Debug.enabled)
{
    Debug.print = function(message)
    {
        if (this.enabled)
            print(message);
    }
}
else
{
    Debug.print = function(message)
    {
    }
}


