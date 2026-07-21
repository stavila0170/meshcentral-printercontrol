/**
 * MeshCentral Printer Control plugin - MeshCore side.
 *
 * ES5 syntax is intentional because this runs inside MeshAgent's Duktape
 * runtime. Printer operations execute through Windows PowerShell in the
 * existing LocalSystem Mesh Agent service; no additional executable or
 * Windows service is installed.
 */
"use strict";

var mesh;
var SCRIPT_VERSION = "0.4.0";
var SCRIPT_BASE64 = "cGFyYW0oCiAgICBbUGFyYW1ldGVyKE1hbmRhdG9yeSA9ICR0cnVlKV0KICAgIFtWYWxpZGF0ZVNldCgKICAgICAgICAnaW52ZW50b3J5JywgJ2pvYnMnLCAnY2FuY2VsSm9iJywgJ3BhdXNlSm9iJywgJ3Jlc3VtZUpvYicsCiAgICAgICAgJ3Rlc3RQYWdlJywgJ2FkZFRjcFByaW50ZXInLCAnZGVsZXRlUHJpbnRlcicsICdyZW1vdmVQb3J0JywKICAgICAgICAncmVtb3ZlRHJpdmVyJywgJ3Nwb29sZXJTdGFydCcsICdzcG9vbGVyU3RvcCcsICdzcG9vbGVyUmVzdGFydCcsCiAgICAgICAgJ2NsZWFyUXVldWUnCiAgICApXQogICAgW3N0cmluZ10kQWN0aW9uLAoKICAgIFtQYXJhbWV0ZXIoTWFuZGF0b3J5ID0gJHRydWUpXQogICAgW3N0cmluZ10kUGF5bG9hZEJhc2U2NAopCgokRXJyb3JBY3Rpb25QcmVmZXJlbmNlID0gJ1N0b3AnCltDb25zb2xlXTo6T3V0cHV0RW5jb2RpbmcgPSBbU3lzdGVtLlRleHQuVVRGOEVuY29kaW5nXTo6bmV3KCRmYWxzZSkKJFByb2dyZXNzUHJlZmVyZW5jZSA9ICdTaWxlbnRseUNvbnRpbnVlJwoKZnVuY3Rpb24gV3JpdGUtQXVkaXRSZWNvcmQgewogICAgcGFyYW0oCiAgICAgICAgW2Jvb2xdJFN1Y2Nlc3MsCiAgICAgICAgW3N0cmluZ10kRXJyb3JNZXNzYWdlID0gJG51bGwKICAgICkKICAgIHRyeSB7CiAgICAgICAgJGF1ZGl0UGF0aCA9IEpvaW4tUGF0aCAkUFNTY3JpcHRSb290ICdhdWRpdC5sb2cnCiAgICAgICAgaWYgKChUZXN0LVBhdGggLUxpdGVyYWxQYXRoICRhdWRpdFBhdGgpIC1hbmQgKEdldC1JdGVtIC1MaXRlcmFsUGF0aCAkYXVkaXRQYXRoKS5MZW5ndGggLWd0IDUyNDI4ODApIHsKICAgICAgICAgICAgJHByZXZpb3VzUGF0aCA9ICIkYXVkaXRQYXRoLjEiCiAgICAgICAgICAgIFJlbW92ZS1JdGVtIC1MaXRlcmFsUGF0aCAkcHJldmlvdXNQYXRoIC1Gb3JjZSAtRXJyb3JBY3Rpb24gU2lsZW50bHlDb250aW51ZQogICAgICAgICAgICBNb3ZlLUl0ZW0gLUxpdGVyYWxQYXRoICRhdWRpdFBhdGggLURlc3RpbmF0aW9uICRwcmV2aW91c1BhdGggLUZvcmNlCiAgICAgICAgfQogICAgICAgICRyZWNvcmQgPSBbb3JkZXJlZF1AewogICAgICAgICAgICB0aW1lID0gW0RhdGVUaW1lXTo6VXRjTm93LlRvU3RyaW5nKCd5eXl5LU1NLWRkVEhIOm1tOnNzWicpCiAgICAgICAgICAgIGFjdGlvbiA9ICRBY3Rpb24KICAgICAgICAgICAgc3VjY2VzcyA9ICRTdWNjZXNzCiAgICAgICAgfQogICAgICAgIGlmICgtbm90ICRTdWNjZXNzIC1hbmQgLW5vdCBbc3RyaW5nXTo6SXNOdWxsT3JFbXB0eSgkRXJyb3JNZXNzYWdlKSkgewogICAgICAgICAgICAkcmVjb3JkLmVycm9yID0gJEVycm9yTWVzc2FnZS5TdWJzdHJpbmcoMCwgW01hdGhdOjpNaW4oNTAwLCAkRXJyb3JNZXNzYWdlLkxlbmd0aCkpCiAgICAgICAgfQogICAgICAgIEFkZC1Db250ZW50IC1MaXRlcmFsUGF0aCAkYXVkaXRQYXRoIC1WYWx1ZSAoJHJlY29yZCB8IENvbnZlcnRUby1Kc29uIC1Db21wcmVzcykgLUVuY29kaW5nIFVURjgKICAgIH0gY2F0Y2ggeyB9Cn0KCmZ1bmN0aW9uIFdyaXRlLVJlc3VsdCB7CiAgICBwYXJhbSgKICAgICAgICBbYm9vbF0kU3VjY2VzcywKICAgICAgICAkRGF0YSA9ICRudWxsLAogICAgICAgIFtzdHJpbmddJEVycm9yTWVzc2FnZSA9ICRudWxsCiAgICApCiAgICBXcml0ZS1BdWRpdFJlY29yZCAtU3VjY2VzcyAkU3VjY2VzcyAtRXJyb3JNZXNzYWdlICRFcnJvck1lc3NhZ2UKICAgICRyZXN1bHQgPSBbb3JkZXJlZF1AeyBzdWNjZXNzID0gJFN1Y2Nlc3MgfQogICAgaWYgKCRudWxsIC1uZSAkRGF0YSkgeyAkcmVzdWx0LmRhdGEgPSAkRGF0YSB9CiAgICBpZiAoLW5vdCAkU3VjY2VzcykgeyAkcmVzdWx0LmVycm9yID0gJEVycm9yTWVzc2FnZSB9CiAgICAkcmVzdWx0IHwgQ29udmVydFRvLUpzb24gLURlcHRoIDggLUNvbXByZXNzCn0KCmZ1bmN0aW9uIEdldC1QYXJhbWV0ZXJWYWx1ZSB7CiAgICBwYXJhbShbc3RyaW5nXSROYW1lLCAkRGVmYXVsdCA9ICRudWxsKQogICAgJHByb3BlcnR5ID0gJHNjcmlwdDpQYXJhbWV0ZXJzLlBTT2JqZWN0LlByb3BlcnRpZXNbJE5hbWVdCiAgICBpZiAoJG51bGwgLWVxICRwcm9wZXJ0eSkgeyByZXR1cm4gJERlZmF1bHQgfQogICAgcmV0dXJuICRwcm9wZXJ0eS5WYWx1ZQp9CgpmdW5jdGlvbiBHZXQtUHJpbnRlckpvYnMgewogICAgcGFyYW0oW1BhcmFtZXRlcihNYW5kYXRvcnkgPSAkdHJ1ZSldW3N0cmluZ10kUHJpbnRlck5hbWUpCiAgICB0cnkgewogICAgICAgIHJldHVybiBAKEdldC1QcmludEpvYiAtUHJpbnRlck5hbWUgJFByaW50ZXJOYW1lIC1FcnJvckFjdGlvbiBTdG9wIHwgRm9yRWFjaC1PYmplY3QgewogICAgICAgICAgICBbb3JkZXJlZF1AewogICAgICAgICAgICAgICAgaWQgPSBbaW50XSRfLklECiAgICAgICAgICAgICAgICBkb2N1bWVudE5hbWUgPSBbc3RyaW5nXSRfLkRvY3VtZW50TmFtZQogICAgICAgICAgICAgICAgdXNlck5hbWUgPSBbc3RyaW5nXSRfLlVzZXJOYW1lCiAgICAgICAgICAgICAgICBqb2JTdGF0dXMgPSBbc3RyaW5nXSRfLkpvYlN0YXR1cwogICAgICAgICAgICAgICAgc3VibWl0dGVkVGltZSA9IGlmICgkbnVsbCAtbmUgJF8uU3VibWl0dGVkVGltZSkgeyAoW2RhdGV0aW1lXSRfLlN1Ym1pdHRlZFRpbWUpLlRvU3RyaW5nKCdvJykgfSBlbHNlIHsgJG51bGwgfQogICAgICAgICAgICAgICAgc2l6ZSA9IFtsb25nXSRfLlNpemUKICAgICAgICAgICAgICAgIHRvdGFsUGFnZXMgPSBbaW50XSRfLlRvdGFsUGFnZXMKICAgICAgICAgICAgICAgIHBhZ2VzUHJpbnRlZCA9IFtpbnRdJF8uUGFnZXNQcmludGVkCiAgICAgICAgICAgIH0KICAgICAgICB9KQogICAgfSBjYXRjaCB7CiAgICAgICAgcmV0dXJuIEAoKQogICAgfQp9CgpmdW5jdGlvbiBBc3NlcnQtUHJpbnRlckV4aXN0cyB7CiAgICBwYXJhbShbUGFyYW1ldGVyKE1hbmRhdG9yeSA9ICR0cnVlKV1bc3RyaW5nXSRQcmludGVyTmFtZSkKICAgICRwcmludGVyID0gR2V0LVByaW50ZXIgLU5hbWUgJFByaW50ZXJOYW1lIC1FcnJvckFjdGlvbiBTaWxlbnRseUNvbnRpbnVlCiAgICBpZiAoJG51bGwgLWVxICRwcmludGVyKSB7IHRocm93ICJQcmludGVyIG5vdCBmb3VuZDogJFByaW50ZXJOYW1lIiB9CiAgICByZXR1cm4gJHByaW50ZXIKfQoKdHJ5IHsKICAgICRwYXlsb2FkSnNvbiA9IFtTeXN0ZW0uVGV4dC5FbmNvZGluZ106OlVURjguR2V0U3RyaW5nKFtTeXN0ZW0uQ29udmVydF06OkZyb21CYXNlNjRTdHJpbmcoJFBheWxvYWRCYXNlNjQpKQogICAgJHNjcmlwdDpQYXJhbWV0ZXJzID0gJHBheWxvYWRKc29uIHwgQ29udmVydEZyb20tSnNvbgogICAgaWYgKCRudWxsIC1lcSAkc2NyaXB0OlBhcmFtZXRlcnMpIHsgJHNjcmlwdDpQYXJhbWV0ZXJzID0gW3BzY3VzdG9tb2JqZWN0XUB7fSB9CgogICAgSW1wb3J0LU1vZHVsZSBQcmludE1hbmFnZW1lbnQgLUVycm9yQWN0aW9uIFN0b3AKCiAgICBzd2l0Y2ggKCRBY3Rpb24pIHsKICAgICAgICAnaW52ZW50b3J5JyB7CiAgICAgICAgICAgICRzcG9vbGVyID0gR2V0LVNlcnZpY2UgLU5hbWUgU3Bvb2xlciAtRXJyb3JBY3Rpb24gU3RvcAogICAgICAgICAgICAkY2ltRGVmYXVsdHMgPSBAe30KICAgICAgICAgICAgR2V0LUNpbUluc3RhbmNlIC1DbGFzc05hbWUgV2luMzJfUHJpbnRlciAtRXJyb3JBY3Rpb24gU2lsZW50bHlDb250aW51ZSB8IEZvckVhY2gtT2JqZWN0IHsKICAgICAgICAgICAgICAgICRjaW1EZWZhdWx0c1tbc3RyaW5nXSRfLk5hbWVdID0gW2Jvb2xdJF8uRGVmYXVsdAogICAgICAgICAgICB9CgogICAgICAgICAgICAkcHJpbnRlcnMgPSBAKEdldC1QcmludGVyIC1FcnJvckFjdGlvbiBTdG9wIHwgU29ydC1PYmplY3QgTmFtZSB8IEZvckVhY2gtT2JqZWN0IHsKICAgICAgICAgICAgICAgICRqb2JzID0gQChHZXQtUHJpbnRlckpvYnMgLVByaW50ZXJOYW1lICRfLk5hbWUpCiAgICAgICAgICAgICAgICBbb3JkZXJlZF1AewogICAgICAgICAgICAgICAgICAgIG5hbWUgPSBbc3RyaW5nXSRfLk5hbWUKICAgICAgICAgICAgICAgICAgICB0eXBlID0gW3N0cmluZ10kXy5UeXBlCiAgICAgICAgICAgICAgICAgICAgc3RhdHVzID0gW3N0cmluZ10kXy5QcmludGVyU3RhdHVzCiAgICAgICAgICAgICAgICAgICAgZHJpdmVyTmFtZSA9IFtzdHJpbmddJF8uRHJpdmVyTmFtZQogICAgICAgICAgICAgICAgICAgIHBvcnROYW1lID0gW3N0cmluZ10kXy5Qb3J0TmFtZQogICAgICAgICAgICAgICAgICAgIHNoYXJlZCA9IFtib29sXSRfLlNoYXJlZAogICAgICAgICAgICAgICAgICAgIHNoYXJlTmFtZSA9IFtzdHJpbmddJF8uU2hhcmVOYW1lCiAgICAgICAgICAgICAgICAgICAgcHVibGlzaGVkID0gW2Jvb2xdJF8uUHVibGlzaGVkCiAgICAgICAgICAgICAgICAgICAgbG9jYXRpb24gPSBbc3RyaW5nXSRfLkxvY2F0aW9uCiAgICAgICAgICAgICAgICAgICAgY29tbWVudCA9IFtzdHJpbmddJF8uQ29tbWVudAogICAgICAgICAgICAgICAgICAgIGRlZmF1bHQgPSBbYm9vbF0kY2ltRGVmYXVsdHNbW3N0cmluZ10kXy5OYW1lXQogICAgICAgICAgICAgICAgICAgIGpvYkNvdW50ID0gJGpvYnMuQ291bnQKICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgfSkKCiAgICAgICAgICAgICRkcml2ZXJzID0gQChHZXQtUHJpbnRlckRyaXZlciAtRXJyb3JBY3Rpb24gU3RvcCB8IFNvcnQtT2JqZWN0IE5hbWUgfCBGb3JFYWNoLU9iamVjdCB7CiAgICAgICAgICAgICAgICBbb3JkZXJlZF1AewogICAgICAgICAgICAgICAgICAgIG5hbWUgPSBbc3RyaW5nXSRfLk5hbWUKICAgICAgICAgICAgICAgICAgICBtYW51ZmFjdHVyZXIgPSBbc3RyaW5nXSRfLk1hbnVmYWN0dXJlcgogICAgICAgICAgICAgICAgICAgIG1ham9yVmVyc2lvbiA9IFtpbnRdJF8uTWFqb3JWZXJzaW9uCiAgICAgICAgICAgICAgICAgICAgcHJpbnRlckVudmlyb25tZW50ID0gW3N0cmluZ10kXy5QcmludGVyRW52aXJvbm1lbnQKICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgfSkKCiAgICAgICAgICAgICRwb3J0cyA9IEAoR2V0LVByaW50ZXJQb3J0IC1FcnJvckFjdGlvbiBTdG9wIHwgU29ydC1PYmplY3QgTmFtZSB8IEZvckVhY2gtT2JqZWN0IHsKICAgICAgICAgICAgICAgIFtvcmRlcmVkXUB7CiAgICAgICAgICAgICAgICAgICAgbmFtZSA9IFtzdHJpbmddJF8uTmFtZQogICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uID0gW3N0cmluZ10kXy5EZXNjcmlwdGlvbgogICAgICAgICAgICAgICAgICAgIGFkZHJlc3MgPSBbc3RyaW5nXSRfLlByaW50ZXJIb3N0QWRkcmVzcwogICAgICAgICAgICAgICAgICAgIHBvcnROdW1iZXIgPSBpZiAoJG51bGwgLW5lICRfLlBvcnROdW1iZXIpIHsgW2ludF0kXy5Qb3J0TnVtYmVyIH0gZWxzZSB7ICRudWxsIH0KICAgICAgICAgICAgICAgICAgICBzbm1wRW5hYmxlZCA9IGlmICgkbnVsbCAtbmUgJF8uU05NUEVuYWJsZWQpIHsgW2Jvb2xdJF8uU05NUEVuYWJsZWQgfSBlbHNlIHsgJG51bGwgfQogICAgICAgICAgICAgICAgfQogICAgICAgICAgICB9KQoKICAgICAgICAgICAgV3JpdGUtUmVzdWx0IC1TdWNjZXNzICR0cnVlIC1EYXRhIChbb3JkZXJlZF1AewogICAgICAgICAgICAgICAgY29tcHV0ZXJOYW1lID0gJGVudjpDT01QVVRFUk5BTUUKICAgICAgICAgICAgICAgIHNwb29sZXIgPSBbb3JkZXJlZF1AeyBzdGF0dXMgPSBbc3RyaW5nXSRzcG9vbGVyLlN0YXR1czsgc3RhcnRUeXBlID0gW3N0cmluZ10kc3Bvb2xlci5TdGFydFR5cGUgfQogICAgICAgICAgICAgICAgcHJpbnRlcnMgPSAkcHJpbnRlcnMKICAgICAgICAgICAgICAgIGRyaXZlcnMgPSAkZHJpdmVycwogICAgICAgICAgICAgICAgcG9ydHMgPSAkcG9ydHMKICAgICAgICAgICAgfSkKICAgICAgICB9CgogICAgICAgICdqb2JzJyB7CiAgICAgICAgICAgICRwcmludGVyTmFtZSA9IFtzdHJpbmddKEdldC1QYXJhbWV0ZXJWYWx1ZSAncHJpbnRlck5hbWUnKQogICAgICAgICAgICBBc3NlcnQtUHJpbnRlckV4aXN0cyAtUHJpbnRlck5hbWUgJHByaW50ZXJOYW1lIHwgT3V0LU51bGwKICAgICAgICAgICAgV3JpdGUtUmVzdWx0IC1TdWNjZXNzICR0cnVlIC1EYXRhIChbb3JkZXJlZF1AewogICAgICAgICAgICAgICAgcHJpbnRlck5hbWUgPSAkcHJpbnRlck5hbWUKICAgICAgICAgICAgICAgIGpvYnMgPSBAKEdldC1QcmludGVySm9icyAtUHJpbnRlck5hbWUgJHByaW50ZXJOYW1lKQogICAgICAgICAgICB9KQogICAgICAgIH0KCiAgICAgICAgeyAkXyAtaW4gQCgnY2FuY2VsSm9iJywgJ3BhdXNlSm9iJywgJ3Jlc3VtZUpvYicpIH0gewogICAgICAgICAgICAkcHJpbnRlck5hbWUgPSBbc3RyaW5nXShHZXQtUGFyYW1ldGVyVmFsdWUgJ3ByaW50ZXJOYW1lJykKICAgICAgICAgICAgJGpvYklkID0gW2ludF0oR2V0LVBhcmFtZXRlclZhbHVlICdqb2JJZCcpCiAgICAgICAgICAgIEFzc2VydC1QcmludGVyRXhpc3RzIC1QcmludGVyTmFtZSAkcHJpbnRlck5hbWUgfCBPdXQtTnVsbAogICAgICAgICAgICAkam9iID0gR2V0LVByaW50Sm9iIC1QcmludGVyTmFtZSAkcHJpbnRlck5hbWUgLUlEICRqb2JJZCAtRXJyb3JBY3Rpb24gU3RvcAogICAgICAgICAgICBpZiAoJEFjdGlvbiAtZXEgJ2NhbmNlbEpvYicpIHsgJGpvYiB8IFJlbW92ZS1QcmludEpvYiAtQ29uZmlybTokZmFsc2UgLUVycm9yQWN0aW9uIFN0b3AgfQogICAgICAgICAgICBpZiAoJEFjdGlvbiAtZXEgJ3BhdXNlSm9iJykgeyAkam9iIHwgU3VzcGVuZC1QcmludEpvYiAtRXJyb3JBY3Rpb24gU3RvcCB9CiAgICAgICAgICAgIGlmICgkQWN0aW9uIC1lcSAncmVzdW1lSm9iJykgeyAkam9iIHwgUmVzdW1lLVByaW50Sm9iIC1FcnJvckFjdGlvbiBTdG9wIH0KICAgICAgICAgICAgV3JpdGUtUmVzdWx0IC1TdWNjZXNzICR0cnVlIC1EYXRhIChbb3JkZXJlZF1AeyBwcmludGVyTmFtZSA9ICRwcmludGVyTmFtZTsgam9iSWQgPSAkam9iSWQ7IGFjdGlvbiA9ICRBY3Rpb24gfSkKICAgICAgICB9CgogICAgICAgICd0ZXN0UGFnZScgewogICAgICAgICAgICAkcHJpbnRlck5hbWUgPSBbc3RyaW5nXShHZXQtUGFyYW1ldGVyVmFsdWUgJ3ByaW50ZXJOYW1lJykKICAgICAgICAgICAgQXNzZXJ0LVByaW50ZXJFeGlzdHMgLVByaW50ZXJOYW1lICRwcmludGVyTmFtZSB8IE91dC1OdWxsCiAgICAgICAgICAgICRwcmludGVyID0gR2V0LUNpbUluc3RhbmNlIC1DbGFzc05hbWUgV2luMzJfUHJpbnRlciAtRXJyb3JBY3Rpb24gU3RvcCB8IFdoZXJlLU9iamVjdCB7ICRfLk5hbWUgLWVxICRwcmludGVyTmFtZSB9IHwgU2VsZWN0LU9iamVjdCAtRmlyc3QgMQogICAgICAgICAgICBpZiAoJG51bGwgLWVxICRwcmludGVyKSB7IHRocm93ICJQcmludGVyIGlzIG5vdCBhdmFpbGFibGUgdGhyb3VnaCBXaW4zMl9QcmludGVyOiAkcHJpbnRlck5hbWUiIH0KICAgICAgICAgICAgJHJlc3BvbnNlID0gSW52b2tlLUNpbU1ldGhvZCAtSW5wdXRPYmplY3QgJHByaW50ZXIgLU1ldGhvZE5hbWUgUHJpbnRUZXN0UGFnZSAtRXJyb3JBY3Rpb24gU3RvcAogICAgICAgICAgICBpZiAoW2ludF0kcmVzcG9uc2UuUmV0dXJuVmFsdWUgLW5lIDApIHsgdGhyb3cgIlByaW50VGVzdFBhZ2UgZmFpbGVkIHdpdGggY29kZSAkKCRyZXNwb25zZS5SZXR1cm5WYWx1ZSkiIH0KICAgICAgICAgICAgV3JpdGUtUmVzdWx0IC1TdWNjZXNzICR0cnVlIC1EYXRhIChbb3JkZXJlZF1AeyBwcmludGVyTmFtZSA9ICRwcmludGVyTmFtZTsgcXVldWVkID0gJHRydWUgfSkKICAgICAgICB9CgogICAgICAgICdhZGRUY3BQcmludGVyJyB7CiAgICAgICAgICAgICRuYW1lID0gW3N0cmluZ10oR2V0LVBhcmFtZXRlclZhbHVlICduYW1lJykKICAgICAgICAgICAgJGFkZHJlc3MgPSBbc3RyaW5nXShHZXQtUGFyYW1ldGVyVmFsdWUgJ2FkZHJlc3MnKQogICAgICAgICAgICAkZHJpdmVyTmFtZSA9IFtzdHJpbmddKEdldC1QYXJhbWV0ZXJWYWx1ZSAnZHJpdmVyTmFtZScpCiAgICAgICAgICAgICRwb3J0TmFtZSA9IFtzdHJpbmddKEdldC1QYXJhbWV0ZXJWYWx1ZSAncG9ydE5hbWUnICgiSVBfIiArICRhZGRyZXNzKSkKICAgICAgICAgICAgaWYgKEdldC1QcmludGVyIC1OYW1lICRuYW1lIC1FcnJvckFjdGlvbiBTaWxlbnRseUNvbnRpbnVlKSB7IHRocm93ICJBIHByaW50ZXIgbmFtZWQgJyRuYW1lJyBhbHJlYWR5IGV4aXN0cyIgfQogICAgICAgICAgICBpZiAoLW5vdCAoR2V0LVByaW50ZXJEcml2ZXIgLU5hbWUgJGRyaXZlck5hbWUgLUVycm9yQWN0aW9uIFNpbGVudGx5Q29udGludWUpKSB7IHRocm93ICJQcmludGVyIGRyaXZlciBpcyBub3QgaW5zdGFsbGVkOiAkZHJpdmVyTmFtZSIgfQogICAgICAgICAgICBpZiAoLW5vdCAoR2V0LVByaW50ZXJQb3J0IC1OYW1lICRwb3J0TmFtZSAtRXJyb3JBY3Rpb24gU2lsZW50bHlDb250aW51ZSkpIHsKICAgICAgICAgICAgICAgIEFkZC1QcmludGVyUG9ydCAtTmFtZSAkcG9ydE5hbWUgLVByaW50ZXJIb3N0QWRkcmVzcyAkYWRkcmVzcyAtRXJyb3JBY3Rpb24gU3RvcAogICAgICAgICAgICB9CiAgICAgICAgICAgIEFkZC1QcmludGVyIC1OYW1lICRuYW1lIC1Ecml2ZXJOYW1lICRkcml2ZXJOYW1lIC1Qb3J0TmFtZSAkcG9ydE5hbWUgLUVycm9yQWN0aW9uIFN0b3AKICAgICAgICAgICAgV3JpdGUtUmVzdWx0IC1TdWNjZXNzICR0cnVlIC1EYXRhIChbb3JkZXJlZF1AeyBuYW1lID0gJG5hbWU7IGFkZHJlc3MgPSAkYWRkcmVzczsgZHJpdmVyTmFtZSA9ICRkcml2ZXJOYW1lOyBwb3J0TmFtZSA9ICRwb3J0TmFtZSB9KQogICAgICAgIH0KCiAgICAgICAgJ2RlbGV0ZVByaW50ZXInIHsKICAgICAgICAgICAgJHByaW50ZXJOYW1lID0gW3N0cmluZ10oR2V0LVBhcmFtZXRlclZhbHVlICdwcmludGVyTmFtZScpCiAgICAgICAgICAgICRkZWxldGVEcml2ZXIgPSBbYm9vbF0oR2V0LVBhcmFtZXRlclZhbHVlICdkZWxldGVEcml2ZXInICRmYWxzZSkKICAgICAgICAgICAgJGRlbGV0ZVBvcnQgPSBbYm9vbF0oR2V0LVBhcmFtZXRlclZhbHVlICdkZWxldGVQb3J0JyAkZmFsc2UpCiAgICAgICAgICAgICRwcmludGVyID0gQXNzZXJ0LVByaW50ZXJFeGlzdHMgLVByaW50ZXJOYW1lICRwcmludGVyTmFtZQogICAgICAgICAgICAkZHJpdmVyTmFtZSA9IFtzdHJpbmddJHByaW50ZXIuRHJpdmVyTmFtZQogICAgICAgICAgICAkcG9ydE5hbWUgPSBbc3RyaW5nXSRwcmludGVyLlBvcnROYW1lCiAgICAgICAgICAgIEdldC1QcmludEpvYiAtUHJpbnRlck5hbWUgJHByaW50ZXJOYW1lIC1FcnJvckFjdGlvbiBTaWxlbnRseUNvbnRpbnVlIHwgUmVtb3ZlLVByaW50Sm9iIC1Db25maXJtOiRmYWxzZSAtRXJyb3JBY3Rpb24gU2lsZW50bHlDb250aW51ZQogICAgICAgICAgICBSZW1vdmUtUHJpbnRlciAtTmFtZSAkcHJpbnRlck5hbWUgLUNvbmZpcm06JGZhbHNlIC1FcnJvckFjdGlvbiBTdG9wCgogICAgICAgICAgICAkcG9ydFJlbW92ZWQgPSAkZmFsc2UKICAgICAgICAgICAgaWYgKCRkZWxldGVQb3J0IC1hbmQgLW5vdCAoR2V0LVByaW50ZXIgfCBXaGVyZS1PYmplY3QgeyAkXy5Qb3J0TmFtZSAtZXEgJHBvcnROYW1lIH0pKSB7CiAgICAgICAgICAgICAgICBSZW1vdmUtUHJpbnRlclBvcnQgLU5hbWUgJHBvcnROYW1lIC1Db25maXJtOiRmYWxzZSAtRXJyb3JBY3Rpb24gU3RvcAogICAgICAgICAgICAgICAgJHBvcnRSZW1vdmVkID0gJHRydWUKICAgICAgICAgICAgfQogICAgICAgICAgICAkZHJpdmVyUmVtb3ZlZCA9ICRmYWxzZQogICAgICAgICAgICBpZiAoJGRlbGV0ZURyaXZlciAtYW5kIC1ub3QgKEdldC1QcmludGVyIHwgV2hlcmUtT2JqZWN0IHsgJF8uRHJpdmVyTmFtZSAtZXEgJGRyaXZlck5hbWUgfSkpIHsKICAgICAgICAgICAgICAgIFJlbW92ZS1QcmludGVyRHJpdmVyIC1OYW1lICRkcml2ZXJOYW1lIC1Db25maXJtOiRmYWxzZSAtRXJyb3JBY3Rpb24gU3RvcAogICAgICAgICAgICAgICAgJGRyaXZlclJlbW92ZWQgPSAkdHJ1ZQogICAgICAgICAgICB9CiAgICAgICAgICAgIFdyaXRlLVJlc3VsdCAtU3VjY2VzcyAkdHJ1ZSAtRGF0YSAoW29yZGVyZWRdQHsKICAgICAgICAgICAgICAgIHByaW50ZXJOYW1lID0gJHByaW50ZXJOYW1lCiAgICAgICAgICAgICAgICByZW1vdmVkID0gJHRydWUKICAgICAgICAgICAgICAgIHBvcnROYW1lID0gJHBvcnROYW1lCiAgICAgICAgICAgICAgICBwb3J0UmVtb3ZlZCA9ICRwb3J0UmVtb3ZlZAogICAgICAgICAgICAgICAgZHJpdmVyTmFtZSA9ICRkcml2ZXJOYW1lCiAgICAgICAgICAgICAgICBkcml2ZXJSZW1vdmVkID0gJGRyaXZlclJlbW92ZWQKICAgICAgICAgICAgfSkKICAgICAgICB9CgogICAgICAgICdyZW1vdmVQb3J0JyB7CiAgICAgICAgICAgICRwb3J0TmFtZSA9IFtzdHJpbmddKEdldC1QYXJhbWV0ZXJWYWx1ZSAncG9ydE5hbWUnKQogICAgICAgICAgICBpZiAoR2V0LVByaW50ZXIgfCBXaGVyZS1PYmplY3QgeyAkXy5Qb3J0TmFtZSAtZXEgJHBvcnROYW1lIH0pIHsgdGhyb3cgIlByaW50ZXIgcG9ydCBpcyBzdGlsbCBpbiB1c2U6ICRwb3J0TmFtZSIgfQogICAgICAgICAgICBpZiAoLW5vdCAoR2V0LVByaW50ZXJQb3J0IC1OYW1lICRwb3J0TmFtZSAtRXJyb3JBY3Rpb24gU2lsZW50bHlDb250aW51ZSkpIHsgdGhyb3cgIlByaW50ZXIgcG9ydCBub3QgZm91bmQ6ICRwb3J0TmFtZSIgfQogICAgICAgICAgICBSZW1vdmUtUHJpbnRlclBvcnQgLU5hbWUgJHBvcnROYW1lIC1Db25maXJtOiRmYWxzZSAtRXJyb3JBY3Rpb24gU3RvcAogICAgICAgICAgICBXcml0ZS1SZXN1bHQgLVN1Y2Nlc3MgJHRydWUgLURhdGEgKFtvcmRlcmVkXUB7IHBvcnROYW1lID0gJHBvcnROYW1lOyByZW1vdmVkID0gJHRydWUgfSkKICAgICAgICB9CgogICAgICAgICdyZW1vdmVEcml2ZXInIHsKICAgICAgICAgICAgJGRyaXZlck5hbWUgPSBbc3RyaW5nXShHZXQtUGFyYW1ldGVyVmFsdWUgJ2RyaXZlck5hbWUnKQogICAgICAgICAgICBpZiAoR2V0LVByaW50ZXIgfCBXaGVyZS1PYmplY3QgeyAkXy5Ecml2ZXJOYW1lIC1lcSAkZHJpdmVyTmFtZSB9KSB7IHRocm93ICJQcmludGVyIGRyaXZlciBpcyBzdGlsbCBpbiB1c2U6ICRkcml2ZXJOYW1lIiB9CiAgICAgICAgICAgIGlmICgtbm90IChHZXQtUHJpbnRlckRyaXZlciAtTmFtZSAkZHJpdmVyTmFtZSAtRXJyb3JBY3Rpb24gU2lsZW50bHlDb250aW51ZSkpIHsgdGhyb3cgIlByaW50ZXIgZHJpdmVyIG5vdCBmb3VuZDogJGRyaXZlck5hbWUiIH0KICAgICAgICAgICAgUmVtb3ZlLVByaW50ZXJEcml2ZXIgLU5hbWUgJGRyaXZlck5hbWUgLUNvbmZpcm06JGZhbHNlIC1FcnJvckFjdGlvbiBTdG9wCiAgICAgICAgICAgIFdyaXRlLVJlc3VsdCAtU3VjY2VzcyAkdHJ1ZSAtRGF0YSAoW29yZGVyZWRdQHsgZHJpdmVyTmFtZSA9ICRkcml2ZXJOYW1lOyByZW1vdmVkID0gJHRydWUgfSkKICAgICAgICB9CgogICAgICAgICdzcG9vbGVyU3RhcnQnIHsKICAgICAgICAgICAgU3RhcnQtU2VydmljZSAtTmFtZSBTcG9vbGVyIC1FcnJvckFjdGlvbiBTdG9wCiAgICAgICAgICAgIChHZXQtU2VydmljZSAtTmFtZSBTcG9vbGVyKS5XYWl0Rm9yU3RhdHVzKCdSdW5uaW5nJywgW1RpbWVTcGFuXTo6RnJvbVNlY29uZHMoMjApKQogICAgICAgICAgICBXcml0ZS1SZXN1bHQgLVN1Y2Nlc3MgJHRydWUgLURhdGEgKFtvcmRlcmVkXUB7IHN0YXR1cyA9ICdSdW5uaW5nJyB9KQogICAgICAgIH0KCiAgICAgICAgJ3Nwb29sZXJTdG9wJyB7CiAgICAgICAgICAgIFN0b3AtU2VydmljZSAtTmFtZSBTcG9vbGVyIC1Gb3JjZSAtRXJyb3JBY3Rpb24gU3RvcAogICAgICAgICAgICAoR2V0LVNlcnZpY2UgLU5hbWUgU3Bvb2xlcikuV2FpdEZvclN0YXR1cygnU3RvcHBlZCcsIFtUaW1lU3Bhbl06OkZyb21TZWNvbmRzKDIwKSkKICAgICAgICAgICAgV3JpdGUtUmVzdWx0IC1TdWNjZXNzICR0cnVlIC1EYXRhIChbb3JkZXJlZF1AeyBzdGF0dXMgPSAnU3RvcHBlZCcgfSkKICAgICAgICB9CgogICAgICAgICdzcG9vbGVyUmVzdGFydCcgewogICAgICAgICAgICAkc2VydmljZSA9IEdldC1TZXJ2aWNlIC1OYW1lIFNwb29sZXIgLUVycm9yQWN0aW9uIFN0b3AKICAgICAgICAgICAgaWYgKCRzZXJ2aWNlLlN0YXR1cyAtZXEgJ1J1bm5pbmcnKSB7CiAgICAgICAgICAgICAgICBSZXN0YXJ0LVNlcnZpY2UgLU5hbWUgU3Bvb2xlciAtRm9yY2UgLUVycm9yQWN0aW9uIFN0b3AKICAgICAgICAgICAgfSBlbHNlIHsKICAgICAgICAgICAgICAgIFN0YXJ0LVNlcnZpY2UgLU5hbWUgU3Bvb2xlciAtRXJyb3JBY3Rpb24gU3RvcAogICAgICAgICAgICB9CiAgICAgICAgICAgIChHZXQtU2VydmljZSAtTmFtZSBTcG9vbGVyKS5XYWl0Rm9yU3RhdHVzKCdSdW5uaW5nJywgW1RpbWVTcGFuXTo6RnJvbVNlY29uZHMoMjUpKQogICAgICAgICAgICBXcml0ZS1SZXN1bHQgLVN1Y2Nlc3MgJHRydWUgLURhdGEgKFtvcmRlcmVkXUB7IHN0YXR1cyA9ICdSdW5uaW5nJyB9KQogICAgICAgIH0KCiAgICAgICAgJ2NsZWFyUXVldWUnIHsKICAgICAgICAgICAgU3RvcC1TZXJ2aWNlIC1OYW1lIFNwb29sZXIgLUZvcmNlIC1FcnJvckFjdGlvbiBTdG9wCiAgICAgICAgICAgIChHZXQtU2VydmljZSAtTmFtZSBTcG9vbGVyKS5XYWl0Rm9yU3RhdHVzKCdTdG9wcGVkJywgW1RpbWVTcGFuXTo6RnJvbVNlY29uZHMoMjApKQogICAgICAgICAgICAkcXVldWVQYXRoID0gSm9pbi1QYXRoICRlbnY6U3lzdGVtUm9vdCAnU3lzdGVtMzJcc3Bvb2xcUFJJTlRFUlMnCiAgICAgICAgICAgICRyZW1vdmVkID0gMAogICAgICAgICAgICBpZiAoVGVzdC1QYXRoIC1MaXRlcmFsUGF0aCAkcXVldWVQYXRoKSB7CiAgICAgICAgICAgICAgICAkZmlsZXMgPSBAKEdldC1DaGlsZEl0ZW0gLUxpdGVyYWxQYXRoICRxdWV1ZVBhdGggLUZvcmNlIC1GaWxlIC1FcnJvckFjdGlvbiBTaWxlbnRseUNvbnRpbnVlKQogICAgICAgICAgICAgICAgJHJlbW92ZWQgPSAkZmlsZXMuQ291bnQKICAgICAgICAgICAgICAgICRmaWxlcyB8IFJlbW92ZS1JdGVtIC1Gb3JjZSAtRXJyb3JBY3Rpb24gU3RvcAogICAgICAgICAgICB9CiAgICAgICAgICAgIFN0YXJ0LVNlcnZpY2UgLU5hbWUgU3Bvb2xlciAtRXJyb3JBY3Rpb24gU3RvcAogICAgICAgICAgICAoR2V0LVNlcnZpY2UgLU5hbWUgU3Bvb2xlcikuV2FpdEZvclN0YXR1cygnUnVubmluZycsIFtUaW1lU3Bhbl06OkZyb21TZWNvbmRzKDIwKSkKICAgICAgICAgICAgV3JpdGUtUmVzdWx0IC1TdWNjZXNzICR0cnVlIC1EYXRhIChbb3JkZXJlZF1AeyBzdGF0dXMgPSAnUnVubmluZyc7IHJlbW92ZWRGaWxlcyA9ICRyZW1vdmVkIH0pCiAgICAgICAgfQogICAgfQp9IGNhdGNoIHsKICAgIHRyeSB7CiAgICAgICAgaWYgKCRBY3Rpb24gLWVxICdjbGVhclF1ZXVlJykgeyBTdGFydC1TZXJ2aWNlIC1OYW1lIFNwb29sZXIgLUVycm9yQWN0aW9uIFNpbGVudGx5Q29udGludWUgfQogICAgfSBjYXRjaCB7IH0KICAgIFdyaXRlLVJlc3VsdCAtU3VjY2VzcyAkZmFsc2UgLUVycm9yTWVzc2FnZSAkXy5FeGNlcHRpb24uTWVzc2FnZQp9Cg==";
var ALLOWED_ACTIONS = {
    inventory: true,
    jobs: true,
    cancelJob: true,
    pauseJob: true,
    resumeJob: true,
    testPage: true,
    addTcpPrinter: true,
    deletePrinter: true,
    removePort: true,
    removeDriver: true,
    spoolerStart: true,
    spoolerStop: true,
    spoolerRestart: true,
    clearQueue: true
};

function own(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
}

function isObject(value) {
    return value != null && typeof value === "object" && !Array.isArray(value);
}

function rejectUnexpected(params, allowed) {
    for (var key in params) {
        if (own(params, key) && !allowed[key]) return "Unexpected parameter: " + key;
    }
    return null;
}

function readString(params, name, required, maximum) {
    if (!own(params, name)) {
        if (required) throw new Error("Missing parameter: " + name);
        return null;
    }
    var value = params[name];
    if (typeof value !== "string" || value.length < 1 || value.length > maximum || /[\x00-\x1f]/.test(value)) {
        throw new Error("Invalid parameter: " + name);
    }
    return value;
}

function readBoolean(params, name, defaultValue) {
    if (!own(params, name)) return defaultValue;
    if (typeof params[name] !== "boolean") throw new Error("Invalid parameter: " + name);
    return params[name];
}

function validateParameters(operation, input) {
    var params = input == null ? {} : input;
    if (!isObject(params)) throw new Error("Operation parameters must be an object");
    var output = {};
    var unexpected;

    if (operation === "inventory" || operation === "spoolerStart" || operation === "spoolerStop" ||
            operation === "spoolerRestart" || operation === "clearQueue") {
        unexpected = rejectUnexpected(params, {});
        if (unexpected) throw new Error(unexpected);
        return output;
    }

    if (operation === "jobs" || operation === "testPage") {
        unexpected = rejectUnexpected(params, { printerName: true });
        if (unexpected) throw new Error(unexpected);
        output.printerName = readString(params, "printerName", true, 256);
        return output;
    }

    if (operation === "cancelJob" || operation === "pauseJob" || operation === "resumeJob") {
        unexpected = rejectUnexpected(params, { printerName: true, jobId: true });
        if (unexpected) throw new Error(unexpected);
        output.printerName = readString(params, "printerName", true, 256);
        if (typeof params.jobId !== "number" || !isFinite(params.jobId) || Math.floor(params.jobId) !== params.jobId ||
                params.jobId < 1 || params.jobId > 2147483647) {
            throw new Error("Invalid parameter: jobId");
        }
        output.jobId = params.jobId;
        return output;
    }

    if (operation === "addTcpPrinter") {
        unexpected = rejectUnexpected(params, { name: true, address: true, driverName: true, portName: true });
        if (unexpected) throw new Error(unexpected);
        output.name = readString(params, "name", true, 256);
        output.address = readString(params, "address", true, 255);
        output.driverName = readString(params, "driverName", true, 256);
        var portName = readString(params, "portName", false, 256);
        if (portName != null) output.portName = portName;
        return output;
    }

    if (operation === "deletePrinter") {
        unexpected = rejectUnexpected(params, { printerName: true, deletePort: true, deleteDriver: true });
        if (unexpected) throw new Error(unexpected);
        output.printerName = readString(params, "printerName", true, 256);
        output.deletePort = readBoolean(params, "deletePort", false);
        output.deleteDriver = readBoolean(params, "deleteDriver", false);
        return output;
    }

    if (operation === "removePort") {
        unexpected = rejectUnexpected(params, { portName: true });
        if (unexpected) throw new Error(unexpected);
        output.portName = readString(params, "portName", true, 256);
        return output;
    }

    if (operation === "removeDriver") {
        unexpected = rejectUnexpected(params, { driverName: true });
        if (unexpected) throw new Error(unexpected);
        output.driverName = readString(params, "driverName", true, 256);
        return output;
    }

    throw new Error("Unsupported printer operation");
}

function sameBuffer(left, right) {
    if (!left || !right || left.length !== right.length) return false;
    for (var i = 0; i < left.length; i++) {
        if (left[i] !== right[i]) return false;
    }
    return true;
}

function ensureDirectory(fs, directory) {
    try {
        if (!fs.existsSync(directory)) fs.mkdirSync(directory);
    } catch (ex) {
        if (!fs.existsSync(directory)) throw ex;
    }
}

function ensureOperationScript() {
    var fs = require("fs");
    var root = (process.env.ProgramData || "C:\\ProgramData") + "\\MeshPrinterControl";
    var scriptPath = root + "\\printer_ops-" + SCRIPT_VERSION + ".ps1";
    ensureDirectory(fs, root);

    var expected = Buffer.from(SCRIPT_BASE64, "base64");
    var current = null;
    try {
        if (fs.existsSync(scriptPath)) current = fs.readFileSync(scriptPath);
    } catch (ignore) { }
    if (!sameBuffer(current, expected)) {
        fs.writeFileSync(scriptPath, expected);
        current = fs.readFileSync(scriptPath);
        if (!sameBuffer(current, expected)) throw new Error("Unable to verify the local operation script");
    }
    return scriptPath;
}

function findPowerShell() {
    var fs = require("fs");
    var systemRoot = process.env.SystemRoot || "C:\\Windows";
    var candidates = [];
    if (process.env.PROCESSOR_ARCHITEW6432) {
        candidates.push(systemRoot + "\\Sysnative\\WindowsPowerShell\\v1.0\\powershell.exe");
    }
    candidates.push(systemRoot + "\\System32\\WindowsPowerShell\\v1.0\\powershell.exe");
    for (var i = 0; i < candidates.length; i++) {
        try { if (fs.existsSync(candidates[i])) return candidates[i]; } catch (ignore) { }
    }
    throw new Error("Windows PowerShell 5.1 was not found");
}

function captureProcess(executable, argv) {
    var callbackError = null;
    var callbackStderr = "";
    var child = require("child_process").execFile(
        executable,
        argv,
        { cwd: process.env.TEMP || "C:\\Windows\\Temp" },
        function (err, out, errout) {
            callbackError = err;
            callbackStderr = errout || "";
        }
    );
    child.stdout.str = "";
    child.stdout.on("data", function (chunk) { this.str += chunk.toString(); });
    if (child.stderr) {
        child.stderr.str = "";
        child.stderr.on("data", function (chunk) { this.str += chunk.toString(); });
    }
    child.waitExit();
    return {
        stdout: child.stdout.str || "",
        stderr: child.stderr ? (child.stderr.str || "") : callbackStderr,
        error: callbackError
    };
}

function parsePowerShellResult(stdout) {
    var text = String(stdout || "").trim();
    if (!text) throw new Error("PowerShell returned no data");
    if (text.length > 1048576) throw new Error("PowerShell response exceeded 1 MiB");
    try { return JSON.parse(text); } catch (ignore) { }

    var lines = text.split(/\r?\n/);
    for (var i = lines.length - 1; i >= 0; i--) {
        var candidate = lines[i].trim();
        if (candidate.charAt(0) === "{") {
            try { return JSON.parse(candidate); } catch (ignore2) { }
        }
    }
    throw new Error("PowerShell returned invalid JSON");
}

function runPowerShell(operation, params) {
    var scriptPath;
    var powershellPath;
    try {
        scriptPath = ensureOperationScript();
        powershellPath = findPowerShell();
    } catch (ex) {
        return { success: false, error: "Unable to prepare printer operations: " + ex };
    }

    var payloadBase64 = Buffer.from(JSON.stringify(params)).toString("base64");
    var result;
    try {
        result = captureProcess(powershellPath, [
            "powershell.exe",
            "-NoLogo",
            "-NoProfile",
            "-NonInteractive",
            "-ExecutionPolicy", "Bypass",
            "-File", scriptPath,
            "-Action", operation,
            "-PayloadBase64", payloadBase64
        ]);
    } catch (ex2) {
        return { success: false, error: "Unable to start Windows PowerShell: " + ex2 };
    }

    try {
        return parsePowerShellResult(result.stdout);
    } catch (parseError) {
        var detail = String(result.stderr || result.error || parseError).substring(0, 1200);
        return { success: false, error: detail };
    }
}

function sendResult(requestId, operation, result) {
    mesh.SendCommand({
        action: "plugin",
        plugin: "printercontrol",
        pluginaction: "operationResult",
        requestId: requestId,
        operation: operation,
        success: result && result.success === true,
        error: result && result.success === true ? null : String((result && result.error) || "Printer operation failed"),
        data: result && result.data != null ? result.data : null
    });
}

function consoleaction(args, rights, sessionid, parent) {
    mesh = parent;
    if (!args || process.platform !== "win32") {
        if (args && args.requestId) sendResult(args.requestId, args.pluginaction, { success: false, error: "Windows is required" });
        return;
    }

    var operation = args.pluginaction;
    if (!ALLOWED_ACTIONS[operation] || typeof args.requestId !== "string" || !/^[a-f0-9]{36}$/.test(args.requestId)) return;

    var params;
    try {
        params = validateParameters(operation, args.params);
    } catch (validationError) {
        sendResult(args.requestId, operation, { success: false, error: String(validationError.message || validationError) });
        return;
    }
    sendResult(args.requestId, operation, runPowerShell(operation, params));
}

module.exports = { consoleaction: consoleaction };
